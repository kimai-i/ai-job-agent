/**
 * Maps the app's 10 tracking fields to columns in the existing
 * `public.job_applications` table (verified against the live schema).
 * NOT NULL: platform, job_posting_title, link, status.
 * CHECK constraints restrict status and client_acquisition (nullable) to the
 * values in options.ts — see supabase/client-acquisition-options.sql.
 *
 * The table itself is never created, altered or dropped by this app.
 */
import { normalizeJobUrl } from "./format";

export const TABLE = "job_applications";
export const ID_COLUMN = "id";
/** Owner column; RLS policies scope rows to auth.uid(). Set on insert only. */
export const USER_ID_COLUMN = "user_id";

export type JobFieldKey =
  | "platform"
  | "dateApplied"
  | "jobTitle"
  | "link"
  | "clientName"
  | "jobType"
  | "rate"
  | "timeZone"
  | "status"
  | "clientAcquisition";

export const COLUMN_MAP: Record<JobFieldKey, string> = {
  platform: "platform",
  dateApplied: "date_applied",
  jobTitle: "job_posting_title",
  link: "link",
  clientName: "client_name",
  jobType: "job_type",
  rate: "rate",
  timeZone: "time_zone",
  status: "status",
  clientAcquisition: "client_acquisition",
};

/** The 10 list-view columns, in the required display order. */
export const LIST_COLUMNS: { key: JobFieldKey; label: string }[] = [
  { key: "platform", label: "Platform" },
  { key: "dateApplied", label: "Date Applied" },
  { key: "jobTitle", label: "Job Posting Title" },
  { key: "link", label: "Link" },
  { key: "clientName", label: "Client Name" },
  { key: "jobType", label: "Job Type" },
  { key: "rate", label: "Rate" },
  { key: "timeZone", label: "Time Zone" },
  { key: "status", label: "Status" },
  { key: "clientAcquisition", label: "Client Acquisition" },
];

/** Extra read-only columns shown on the Job Discovery page. */
export type ColumnKey = JobFieldKey | "dateDiscovered" | "score" | "reason" | "notes";

/** Job Discovery columns: same as the list view, with discovery date and match score. */
export const DISCOVERY_COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "platform", label: "Platform" },
  { key: "dateDiscovered", label: "Date Discovered" },
  { key: "jobTitle", label: "Job Posting Title" },
  { key: "link", label: "Link" },
  { key: "clientName", label: "Client Name" },
  { key: "jobType", label: "Job Type" },
  { key: "rate", label: "Rate" },
  { key: "timeZone", label: "Time Zone" },
  { key: "status", label: "Status" },
  { key: "score", label: "Match Score" },
];

/** "Not pursued" tab: same as Discovery, with the reason right after Status. */
export const NOT_PURSUED_COLUMNS: { key: ColumnKey; label: string }[] = DISCOVERY_COLUMNS.flatMap((c) =>
  c.key === "status" ? [c, { key: "reason" as const, label: "Reason" }] : [c],
);

/**
 * Table columns on Job Applications and the status boards: the list view with
 * Additional Notes in place of Client Acquisition (still in the form and CSV).
 */
export const BOARD_COLUMNS: { key: ColumnKey; label: string }[] = LIST_COLUMNS.map((c) =>
  c.key === "clientAcquisition" ? { key: "notes" as const, label: "Additional Notes" } : c,
);

export type JobFormValues = Record<JobFieldKey, string>;

export type DbRow = Record<string, unknown>;

export interface JobApplication extends JobFormValues {
  id: string;
  /** YYYY-MM-DD the agent (or Kim) first found the job. */
  dateDiscovered: string;
  /** AI match score 0-100 as text, empty if not scored. */
  score: string;
  /** Why a job was screened out or withdrawn (rejection_reason). */
  reason: string;
  /** Kim's own notes (additional_notes). */
  notes: string;
  /** The full database row, including the extra future-automation columns. */
  raw: DbRow;
}

function asText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

export function fromRow(row: DbRow): JobApplication {
  const job = { id: asText(row[ID_COLUMN]), raw: row } as JobApplication;
  for (const key of Object.keys(COLUMN_MAP) as JobFieldKey[]) {
    job[key] = asText(row[COLUMN_MAP[key]]);
  }
  // Date columns may be `date` or `timestamptz`; keep only YYYY-MM-DD.
  job.dateApplied = job.dateApplied.slice(0, 10);
  job.dateDiscovered = (asText(row.date_discovered) || asText(row.created_at)).slice(0, 10);
  job.score = asText(row.ai_match_score);
  job.reason = asText(row.rejection_reason);
  job.notes = asText(row.additional_notes);
  return job;
}

export const NORMALIZED_URL_COLUMN = "normalized_job_url";

/** Converts form values to a row patch. Empty strings become NULL. */
export function toRow(values: JobFormValues): DbRow {
  const row: DbRow = {};
  for (const key of Object.keys(COLUMN_MAP) as JobFieldKey[]) {
    const v = values[key].trim();
    row[COLUMN_MAP[key]] = v === "" ? null : v;
  }
  row[NORMALIZED_URL_COLUMN] = normalizeJobUrl(values.link) || null;
  return row;
}

export const MAPPED_COLUMNS = new Set<string>([
  ID_COLUMN,
  USER_ID_COLUMN,
  NORMALIZED_URL_COLUMN,
  ...Object.values(COLUMN_MAP),
]);
