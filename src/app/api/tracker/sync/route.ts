import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeJobUrl } from "@/lib/jobs/format";
import { OWNER_DECISION_STATUSES, PRE_REVIEW_STATUSES, SUBMITTED_STATUSES } from "@/lib/jobs/options";
import { TABLE } from "@/lib/jobs/schema";

/**
 * Imports job records written by the job-hunting agent into Supabase, using
 * the signed-in user's session (RLS applies), then writes a snapshot of known
 * jobs the agent reads for de-duplication.
 *
 *   job-agent/queue/*.json       -> imported, then moved to queue/processed/
 *   job-agent/state/known-jobs.json <- snapshot of the user's tracker
 */
const AGENT_DIR = path.join(process.cwd(), "job-agent");
const QUEUE_DIR = path.join(AGENT_DIR, "queue");
const PROCESSED_DIR = path.join(QUEUE_DIR, "processed");
const SNAPSHOT_FILE = path.join(AGENT_DIR, "state", "known-jobs.json");

/** Columns the agent may write. `id` and `user_id` are never taken from files. */
const WRITABLE = new Set([
  "platform",
  "date_applied",
  "job_posting_title",
  "link",
  "client_name",
  "job_type",
  "rate",
  "time_zone",
  "status",
  "client_acquisition",
  "date_discovered",
  "job_description",
  "ai_match_score",
  "portfolio_url",
  "resume_url",
  "case_study_url",
  "cover_letter",
  "qualification_notes",
  "submission_evidence",
  "posting_date",
  "expected_rate",
  "olj_points",
  "application_method",
  "application_instructions",
  "email_subject",
  "rejection_reason",
  "video_required",
  "references_required",
  "last_reply_at",
  "last_reply_channel",
  "last_reply_summary",
  "additional_notes",
]);

type Row = Record<string, unknown>;

function sanitize(input: Row): Row {
  const row: Row = {};
  for (const [k, v] of Object.entries(input)) {
    if (WRITABLE.has(k) && v !== undefined) row[k] = v === "" ? null : v;
  }
  return row;
}

// Imports run one at a time so overlapping page loads can't import a file twice.
let queueLock: Promise<unknown> = Promise.resolve();

export async function POST() {
  // Wait for an in-flight import, but never more than 30 s, so one stuck
  // import can't block every later request.
  const previous = Promise.race([queueLock, new Promise((r) => setTimeout(r, 30_000))]);
  const run = previous.then(runSync, runSync);
  queueLock = run.catch(() => {});
  return run;
}

async function runSync() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let files: string[] = [];
  try {
    files = (await fs.readdir(QUEUE_DIR)).filter((f) => f.endsWith(".json")).sort();
  } catch {
    // No queue folder (e.g. a deployed environment): nothing to import.
  }

  let inserted = 0;
  let updated = 0;
  const errors: string[] = [];

  // Look up every existing job once (by normalised link) instead of one query
  // per record, so large batches import in seconds.
  const existingByUrl = new Map<string, { id: string; status: string }>();
  if (files.length) {
    // The API returns at most 1,000 rows per request, so page through them.
    const PAGE = 1000;
    for (let from = 0; ; from += PAGE) {
      const { data: rows, error } = await supabase
        .from(TABLE)
        .select("id, status, normalized_job_url")
        .order("id")
        .range(from, from + PAGE - 1);
      if (error) {
        return NextResponse.json({ files: files.length, inserted, updated, errors: [`Lookup failed: ${error.message}`] });
      }
      for (const r of rows ?? []) {
        if (r.normalized_job_url) existingByUrl.set(r.normalized_job_url, { id: r.id, status: r.status });
      }
      if (!rows || rows.length < PAGE) break;
    }
  }

  for (const file of files) {
    const fullPath = path.join(QUEUE_DIR, file);
    let records: Row[];
    try {
      // Strip a UTF-8 byte-order mark (Windows tools often add one).
      const parsed = JSON.parse((await fs.readFile(fullPath, "utf8")).replace(/^﻿/, ""));
      records = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.jobs) ? parsed.jobs : [parsed];
    } catch (e) {
      // Already imported and moved by an overlapping run: nothing to do.
      if ((e as NodeJS.ErrnoException).code === "ENOENT") continue;
      errors.push(`${file}: invalid JSON (${(e as Error).message})`);
      continue;
    }

    let fileOk = true;
    const toInsert: { index: number; row: Row }[] = [];
    for (const [i, record] of records.entries()) {
      const row = sanitize(record);
      const normalized = normalizeJobUrl(String(row.link ?? ""));
      if (!row.job_posting_title || !normalized || !row.platform) {
        errors.push(`${file}[${i}]: job_posting_title, platform and a valid link are required`);
        fileOk = false;
        continue;
      }
      row.normalized_job_url = normalized;

      const existing = existingByUrl.get(normalized);
      if (!existing) {
        // Insert later in one batch; remember it so duplicates in the same file update instead.
        toInsert.push({ index: i, row });
        existingByUrl.set(normalized, { id: "", status: String(row.status ?? "") });
        continue;
      }
      if (!existing.id) {
        // Duplicate of a row queued for insert in this same run: merge into it.
        const pending = toInsert.find((p) => p.row.normalized_job_url === normalized);
        if (pending) Object.assign(pending.row, row);
        continue;
      }

      {
        // Never move a submitted application back to an earlier status, and
        // never let a discovery run undo Kim's Send / Withdraw decision.
        if (SUBMITTED_STATUSES.includes(existing.status) && !SUBMITTED_STATUSES.includes(String(row.status))) {
          delete row.status;
        }
        if (OWNER_DECISION_STATUSES.includes(existing.status) && PRE_REVIEW_STATUSES.includes(String(row.status))) {
          delete row.status;
        }
        const { error } = await supabase
          .from(TABLE)
          .update({ ...row, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (error) {
          errors.push(`${file}[${i}]: ${error.message}`);
          fileOk = false;
        } else {
          updated++;
          if (row.status) existing.status = String(row.status);
        }
      }
    }

    if (toInsert.length) {
      const { data: created, error } = await supabase
        .from(TABLE)
        .insert(toInsert.map(({ row }) => ({ ...row, user_id: userId })))
        .select("id, status, normalized_job_url");
      if (!error) {
        inserted += created?.length ?? 0;
        for (const c of created ?? []) existingByUrl.set(c.normalized_job_url, { id: c.id, status: c.status });
      } else {
        // One bad row fails the whole batch: retry one by one to pinpoint it.
        for (const { index, row } of toInsert) {
          const { data: one, error: oneError } = await supabase
            .from(TABLE)
            .insert({ ...row, user_id: userId })
            .select("id, status, normalized_job_url")
            .single();
          if (oneError) {
            errors.push(`${file}[${index}]: ${oneError.message}`);
            existingByUrl.delete(String(row.normalized_job_url));
            fileOk = false;
          } else {
            inserted++;
            existingByUrl.set(one.normalized_job_url, { id: one.id, status: one.status });
          }
        }
      }
    }

    // Files with errors stay in the queue so nothing is lost; fixed files are retried.
    if (fileOk) {
      await fs.mkdir(PROCESSED_DIR, { recursive: true });
      try {
        await fs.rename(fullPath, path.join(PROCESSED_DIR, file));
      } catch (e) {
        // Moved already by an overlapping run.
        if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
      }
    }
  }

  // Refresh the snapshot the agent uses to skip jobs it has already handled.
  // Newer columns may not exist until their SQL has been run, so fall back to
  // the core columns rather than leaving the snapshot stale.
  const CORE = "normalized_job_url, link, job_posting_title, client_name, platform, status, posting_date, date_applied, updated_at";
  const EXTENDED = `${CORE}, email_subject, application_method, application_instructions, cover_letter, olj_points, expected_rate, approved_at`;
  // Page through all rows (the API caps each request at 1,000).
  const fetchAll = async (columns: string) => {
    const all: Row[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase.from(TABLE).select(columns).order("id").range(from, from + 999);
      if (error) return { data: null, error };
      all.push(...((data ?? []) as unknown as Row[]));
      if (!data || data.length < 1000) return { data: all, error: null };
    }
  };
  let { data: known, error: snapshotError } = await fetchAll(EXTENDED);
  if (snapshotError) {
    ({ data: known, error: snapshotError } = await fetchAll(CORE));
  }
  if (snapshotError) {
    errors.push(`Snapshot not updated: ${snapshotError.message}`);
  } else {
    try {
      await fs.mkdir(path.dirname(SNAPSHOT_FILE), { recursive: true });
      await fs.writeFile(
        SNAPSHOT_FILE,
        JSON.stringify({ generated_at: new Date().toISOString(), jobs: known }, null, 2),
      );
    } catch {
      // Read-only filesystem (deployed): the snapshot is a local-only convenience.
    }
  }

  return NextResponse.json({ files: files.length, inserted, updated, errors });
}
