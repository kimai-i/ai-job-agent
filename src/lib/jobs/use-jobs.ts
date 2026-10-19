"use client";

import { useCallback, useEffect, useState } from "react";
import type { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  ID_COLUMN,
  TABLE,
  USER_ID_COLUMN,
  fromRow,
  toRow,
  type DbRow,
  type JobApplication,
  type JobFormValues,
} from "./schema";

function describeError(error: PostgrestError | Error): string {
  if ("code" in error) {
    if (error.code === "42501")
      return "Permission denied by Row Level Security. Check the table's RLS policies.";
    if (error.code === "42P01" || error.code === "PGRST205")
      return "The job_applications table could not be found via the Data API.";
    if ((error.code === "42703" || error.code === "PGRST204") && error.message.includes("additional_notes"))
      return "Additional Notes needs a one-time database update: run supabase/additional-notes.sql in the Supabase SQL Editor.";
    if (error.code === "42703" || error.code === "PGRST204")
      return `Column mismatch: ${error.message}. The column mapping in src/lib/jobs/schema.ts needs updating.`;
    if (error.code === "23505") return "This job link is already in your tracker.";
    if (error.code === "23514")
      return "The database rejected one of the values (check constraint). Run the latest SQL in the supabase folder.";
  }
  return error.message;
}

export const JOBS_CHANGED_EVENT = "jobs-changed";

export type ReviewDecision = "send" | "withdraw" | "cancel-send" | "mark-applied";

export type SyncResult ={ files: number; inserted: number; updated: number; errors: string[] };

/** Imports jobs queued by the job-hunting agent (local files) under the user's session. */
async function syncAgentQueue(): Promise<SyncResult | null> {
  // Never let a slow import hold up the page: give up waiting after 20 s
  // (the import itself keeps running on the server).
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch("/api/tracker/sync", { method: "POST", signal: controller.signal });
    return res.ok ? ((await res.json()) as SyncResult) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Loads and mutates the signed-in user's job applications. RLS scopes access. */
export function useJobs() {
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sync, setSync] = useState<SyncResult | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await syncAgentQueue();
      // Keep the last non-empty result so a second, empty sync doesn't hide it.
      if (result && (result.inserted || result.updated || result.errors.length)) setSync(result);
      // The API returns at most 1,000 rows per request, so page through them.
      const supabase = createClient();
      const rows: DbRow[] = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase.from(TABLE).select("*").order(ID_COLUMN).range(from, from + 999);
        if (error) throw error;
        rows.push(...(data as DbRow[]));
        if (data.length < 1000) break;
      }
      setJobs(rows.map(fromRow));
      setError(null);
    } catch (e) {
      setError(describeError(e as Error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
    void refresh();
  }, [refresh]);

  // Lets the sidebar refresh its counts (e.g. the Scheduled Interview badge).
  useEffect(() => {
    window.dispatchEvent(new Event(JOBS_CHANGED_EVENT));
  }, [jobs]);

  const createJob = useCallback(async (values: JobFormValues, extras: DbRow = {}) => {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error("Your session has expired. Please sign in again.");
    const { data, error } = await supabase
      .from(TABLE)
      .insert({ ...toRow(values), ...extras, [USER_ID_COLUMN]: auth.user.id })
      .select("*")
      .single();
    if (error) throw new Error(describeError(error));
    const job = fromRow(data as DbRow);
    setJobs((prev) => [job, ...prev]);
    return job;
  }, []);

  /** `extras` carries non-list columns edited in the form (cover letter, subject). */
  const updateJob = useCallback(async (id: string, values: JobFormValues, extras: DbRow = {}) => {
    const { data, error } = await createClient()
      .from(TABLE)
      // The table has no trigger maintaining updated_at, so set it here.
      .update({ ...toRow(values), ...extras, updated_at: new Date().toISOString() })
      .eq(ID_COLUMN, id)
      .select("*")
      .single();
    if (error) throw new Error(describeError(error));
    const job = fromRow(data as DbRow);
    setJobs((prev) => prev.map((j) => (j.id === id ? job : j)));
    return job;
  }, []);

  const deleteJob = useCallback(async (id: string) => {
    const { data, error } = await createClient()
      .from(TABLE)
      .delete()
      .eq(ID_COLUMN, id)
      .select(ID_COLUMN);
    if (error) throw new Error(describeError(error));
    if (!data?.length)
      throw new Error("Nothing was deleted. Row Level Security may not allow deleting this record.");
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }, []);

  /** Deletes several jobs at once (the table's checkboxes). Returns how many were removed. */
  const deleteJobs = useCallback(async (ids: string[]) => {
    const supabase = createClient();
    const deleted = new Set<string>();
    try {
      // Small batches keep each request URL short.
      for (let i = 0; i < ids.length; i += 100) {
        const { data, error } = await supabase
          .from(TABLE)
          .delete()
          .in(ID_COLUMN, ids.slice(i, i + 100))
          .select(ID_COLUMN);
        if (error) throw new Error(describeError(error));
        for (const row of data ?? []) deleted.add(String((row as DbRow)[ID_COLUMN]));
      }
    } finally {
      setJobs((prev) => prev.filter((j) => !deleted.has(j.id)));
    }
    if (deleted.size < ids.length)
      throw new Error(`Deleted ${deleted.size} of ${ids.length}. Row Level Security may not allow deleting the others.`);
    return deleted.size;
  }, []);

  /**
   * Kim's review decision on a drafted application. Only applies if the job is
   * still in the expected status, so a stale page can't undo the agent's work.
   */
  const reviewJob = useCallback(async (id: string, decision: ReviewDecision, opts: { reason?: string } = {}) => {
    const now = new Date().toISOString();
    // Application dates use Asia/Manila (Kim's reference timezone).
    const manilaDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date());
    const change =
      decision === "send"
        ? { from: ["Pending Review"], patch: { status: "Approved to Send", approved_at: now } }
        : decision === "withdraw"
          ? {
              from: ["Pending Review"],
              patch: { status: "Withdrawn", ...(opts.reason?.trim() ? { rejection_reason: opts.reason.trim() } : {}) },
            }
          : decision === "cancel-send"
            ? { from: ["Approved to Send"], patch: { status: "Pending Review", approved_at: null } }
            : {
                from: ["Pending Review", "Approved to Send"],
                patch: {
                  status: "Applied",
                  date_applied: manilaDate,
                  submission_evidence: `Sent manually by Kim from the tracker's review card; marked Applied ${new Date().toLocaleString()}.`,
                },
              };
    const { data, error } = await createClient()
      .from(TABLE)
      .update({ ...change.patch, updated_at: now })
      .eq(ID_COLUMN, id)
      .in("status", change.from)
      .select("*");
    if (error) throw new Error(describeError(error));
    if (!data?.length) {
      await refresh();
      throw new Error("This job's status changed in the meantime. The list has been refreshed.");
    }
    const job = fromRow(data[0] as DbRow);
    setJobs((prev) => prev.map((j) => (j.id === id ? job : j)));
    return job;
  }, [refresh]);

  /**
   * Saves an edited subject / cover letter from the review card. An approval
   * covers the exact text reviewed, so editing an approved draft sends it back
   * to Pending Review.
   */
  const saveDraft = useCallback(async (job: JobApplication, draft: { email_subject: string; cover_letter: string }) => {
    const now = new Date().toISOString();
    const patch: DbRow = {
      email_subject: draft.email_subject.trim() || null,
      cover_letter: draft.cover_letter.trim() || null,
      updated_at: now,
    };
    if (job.status === "Approved to Send") {
      patch.status = "Pending Review";
      patch.approved_at = null;
    }
    const { data, error } = await createClient()
      .from(TABLE)
      .update(patch)
      .eq(ID_COLUMN, job.id)
      .eq("status", job.status)
      .select("*");
    if (error) throw new Error(describeError(error));
    if (!data?.length) {
      await refresh();
      throw new Error("This job's status changed in the meantime. The list has been refreshed.");
    }
    const updated = fromRow(data[0] as DbRow);
    setJobs((prev) => prev.map((j) => (j.id === job.id ? updated : j)));
    return updated;
  }, [refresh]);

  return { jobs, loading, error, sync, refresh, createJob, updateJob, deleteJob, deleteJobs, reviewJob, saveDraft };
}
