"use client";

import { useEffect } from "react";
import { MAPPED_COLUMNS, type JobApplication } from "@/lib/jobs/schema";
import { formatDate } from "@/lib/jobs/format";
import { AcquisitionBadge, StatusBadge } from "./badges";
import { JobLink } from "./job-link";
import { PencilIcon, TrashIcon, XIcon } from "./icons";
import { ReviewCard, type ReviewDecision } from "./review-card";
import { btn } from "./ui";

function humanize(column: string) {
  return column.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatExtra(value: unknown): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return formatDate(text);
  if (/^\d{4}-\d{2}-\d{2}T/.test(text)) return new Date(text).toLocaleString();
  return text;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3 py-3">
      <dt className="text-sm text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="col-span-2 min-w-0 text-sm text-zinc-900 dark:text-zinc-100">{children}</dd>
    </div>
  );
}

const dash = (v: string) => v || <span className="text-zinc-400">—</span>;

export function JobDetailsPanel({
  job,
  onClose,
  onEdit,
  onDelete,
  onReview,
  onSaveDraft,
}: {
  job: JobApplication;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReview?: (decision: ReviewDecision) => Promise<unknown>;
  onSaveDraft?: (draft: { email_subject: string; cover_letter: string }) => Promise<unknown>;
}) {
  const reviewable = job.status === "Pending Review" || job.status === "Approved to Send";
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const extras = Object.entries(job.raw).filter(
    ([k, v]) => !MAPPED_COLUMNS.has(k) && v !== null && v !== "",
  );

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-zinc-950/40" onClick={onClose} />
      <aside
        aria-label="Job details"
        className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col bg-white shadow-2xl dark:bg-zinc-900 dark:ring-1 dark:ring-zinc-800"
      >
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-6 py-5 dark:border-zinc-800">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-indigo-600 uppercase dark:text-indigo-400">
              {job.platform || "Job"}
            </p>
            <h2 className="mt-1 text-lg font-semibold break-words">{job.jobTitle || "Untitled job"}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <StatusBadge value={job.status} />
              <AcquisitionBadge value={job.clientAcquisition} />
            </div>
          </div>
          <button type="button" onClick={onClose} className={btn.icon} aria-label="Close details">
            <XIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          {reviewable && onReview && <ReviewCard job={job} onReview={onReview} onSaveDraft={onSaveDraft} />}
          <dl className="divide-y divide-zinc-100 dark:divide-zinc-800">
            <Row label="Platform">{dash(job.platform)}</Row>
            <Row label="Date Applied">{dash(formatDate(job.dateApplied))}</Row>
            <Row label="Job Posting Title">{dash(job.jobTitle)}</Row>
            <Row label="Link">
              <JobLink value={job.link} full />
            </Row>
            <Row label="Client Name">{dash(job.clientName)}</Row>
            <Row label="Job Type">{dash(job.jobType)}</Row>
            <Row label="Rate">{dash(job.rate)}</Row>
            <Row label="Time Zone">{dash(job.timeZone)}</Row>
            <Row label="Status">
              <StatusBadge value={job.status} />
            </Row>
            <Row label="Client Acquisition">
              <AcquisitionBadge value={job.clientAcquisition} />
            </Row>
          </dl>

          {extras.length > 0 && (
            <>
              <h3 className="mt-6 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                Additional fields
              </h3>
              <dl className="divide-y divide-zinc-100 pb-6 dark:divide-zinc-800">
                {extras.map(([k, v]) => (
                  <Row key={k} label={humanize(k)}>
                    <span className="whitespace-pre-wrap break-words">{formatExtra(v)}</span>
                  </Row>
                ))}
              </dl>
            </>
          )}
        </div>

        <div className="flex gap-2 border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <button type="button" className={`${btn.primary} flex-1`} onClick={onEdit}>
            <PencilIcon /> Edit
          </button>
          <button type="button" className={btn.secondary} onClick={onDelete}>
            <TrashIcon className="size-4 text-rose-600" /> Delete
          </button>
        </div>
      </aside>
    </div>
  );
}
