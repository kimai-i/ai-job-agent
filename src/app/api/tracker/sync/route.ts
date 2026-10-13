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
  const run = queueLock.then(runSync, runSync);
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

  for (const file of files) {
    const fullPath = path.join(QUEUE_DIR, file);
    let records: Row[];
    try {
      // Strip a UTF-8 byte-order mark (Windows tools often add one).
      const parsed = JSON.parse((await fs.readFile(fullPath, "utf8")).replace(/^﻿/, ""));
      records = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.jobs) ? parsed.jobs : [parsed];
    } catch (e) {
      errors.push(`${file}: invalid JSON (${(e as Error).message})`);
      continue;
    }

    let fileOk = true;
    for (const [i, record] of records.entries()) {
      const row = sanitize(record);
      const normalized = normalizeJobUrl(String(row.link ?? ""));
      if (!row.job_posting_title || !normalized || !row.platform) {
        errors.push(`${file}[${i}]: job_posting_title, platform and a valid link are required`);
        fileOk = false;
        continue;
      }
      row.normalized_job_url = normalized;

      const { data: existing, error: findError } = await supabase
        .from(TABLE)
        .select("id, status")
        .eq("normalized_job_url", normalized)
        .maybeSingle();
      if (findError) {
        errors.push(`${file}[${i}]: ${findError.message}`);
        fileOk = false;
        continue;
      }

      if (existing) {
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
        } else updated++;
      } else {
        const { error } = await supabase.from(TABLE).insert({ ...row, user_id: userId });
        if (error) {
          errors.push(`${file}[${i}]: ${error.message}`);
          fileOk = false;
        } else inserted++;
      }
    }

    // Files with errors stay in the queue so nothing is lost; fixed files are retried.
    if (fileOk) {
      await fs.mkdir(PROCESSED_DIR, { recursive: true });
      await fs.rename(fullPath, path.join(PROCESSED_DIR, file));
    }
  }

  // Refresh the snapshot the agent uses to skip jobs it has already handled.
  const { data: known, error: snapshotError } = await supabase
    .from(TABLE)
    .select(
      "normalized_job_url, link, job_posting_title, client_name, platform, status, posting_date, date_applied, email_subject, application_method, application_instructions, cover_letter, olj_points, expected_rate, approved_at, updated_at",
    );
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
