"use client";

import { useState, type FormEvent } from "react";
import { CLIENT_ACQUISITION, JOB_TYPES, PLATFORMS, STATUSES } from "@/lib/jobs/options";
import type { DbRow, JobApplication, JobFieldKey, JobFormValues } from "@/lib/jobs/schema";
import { todayIso } from "@/lib/jobs/format";
import { Modal } from "./modal";
import { btn, input, label } from "./ui";

const EMPTY: JobFormValues = {
  platform: "OnlineJobs.ph",
  dateApplied: "",
  jobTitle: "",
  link: "",
  clientName: "",
  jobType: "Full-time",
  rate: "",
  timeZone: "",
  status: "Discovered",
  clientAcquisition: "",
};

function rawText(job: JobApplication | undefined, column: string): string {
  const v = job?.raw[column];
  return v === null || v === undefined ? "" : String(v);
}

/** Keeps a stored value selectable even if it's not one of the standard options. */
function withCurrent(options: readonly string[], current: string) {
  return current && !options.includes(current) ? [...options, current] : options;
}

export function JobFormModal({
  job,
  onSubmit,
  onClose,
}: {
  job?: JobApplication;
  onSubmit: (values: JobFormValues, extras: DbRow) => Promise<unknown>;
  onClose: () => void;
}) {
  const [values, setValues] = useState<JobFormValues>(() => {
    if (!job) return EMPTY;
    const v = { ...EMPTY };
    for (const k of Object.keys(EMPTY) as JobFieldKey[]) v[k] = job[k];
    return v;
  });
  const initialSubject = rawText(job, "email_subject");
  const initialLetter = rawText(job, "cover_letter");
  const [subject, setSubject] = useState(initialSubject);
  const [coverLetter, setCoverLetter] = useState(initialLetter);
  // Withdrawn / Screened Out jobs keep their "why" in rejection_reason.
  const initialReason = rawText(job, "rejection_reason");
  const [reason, setReason] = useState(initialReason);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const draftChanged = subject !== initialSubject || coverLetter !== initialLetter;
  const wasApproved = job?.status === "Approved to Send";
  const words = coverLetter.trim() ? coverLetter.trim().split(/\s+/).length : 0;

  const set = (key: JobFieldKey) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!values.jobTitle.trim()) {
      setError("Job Posting Title is required.");
      return;
    }
    if (!values.link.trim()) {
      setError("Link is required.");
      return;
    }
    setBusy(true);
    setError(null);
    const extras: DbRow = {};
    let submitted = values;
    if (draftChanged) {
      extras.email_subject = subject.trim() || null;
      extras.cover_letter = coverLetter.trim() || null;
      // An approval covers the exact text Kim reviewed; edits need a fresh approval.
      if (wasApproved && values.status === "Approved to Send") {
        submitted = { ...values, status: "Pending Review" };
        extras.approved_at = null;
      }
    }
    if (reason !== initialReason) extras.rejection_reason = reason.trim() || null;
    try {
      await onSubmit(submitted, extras);
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  const select = (key: JobFieldKey, title: string, options: readonly string[], optional = false) => (
    <div>
      <label htmlFor={key} className={label}>
        {title}
      </label>
      <select id={key} className={input} value={values[key]} onChange={set(key)}>
        {optional && <option value="">— Not set —</option>}
        {withCurrent(options, values[key]).map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );

  return (
    <Modal
      title={job ? "Edit job" : "Add new job"}
      onClose={busy ? () => {} : onClose}
      size="lg"
      footer={
        <>
          <button type="button" className={btn.secondary} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" form="job-form" className={btn.primary} disabled={busy}>
            {busy ? "Saving…" : job ? "Save changes" : "Add job"}
          </button>
        </>
      }
    >
      <form id="job-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="jobTitle" className={label}>
            Job Posting Title <span className="text-rose-500">*</span>
          </label>
          <input
            id="jobTitle"
            className={input}
            value={values.jobTitle}
            onChange={set("jobTitle")}
            placeholder="e.g. Virtual Assistant – Social Media"
            autoFocus
          />
        </div>
        {select("platform", "Platform", PLATFORMS)}
        <div>
          <label htmlFor="dateApplied" className={label}>
            Date Applied
          </label>
          <div className="flex gap-2">
            <input
              id="dateApplied"
              type="date"
              className={input}
              value={values.dateApplied}
              onChange={set("dateApplied")}
            />
            <button
              type="button"
              className={btn.secondary}
              onClick={() => setValues((v) => ({ ...v, dateApplied: todayIso() }))}
            >
              Today
            </button>
          </div>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="link" className={label}>
            Link <span className="text-rose-500">*</span>
          </label>
          <input
            id="link"
            type="url"
            className={input}
            value={values.link}
            onChange={set("link")}
            placeholder="https://"
          />
        </div>
        <div>
          <label htmlFor="clientName" className={label}>
            Client Name
          </label>
          <input id="clientName" className={input} value={values.clientName} onChange={set("clientName")} />
        </div>
        {select("jobType", "Job Type", JOB_TYPES)}
        <div>
          <label htmlFor="rate" className={label}>
            Rate
          </label>
          <input
            id="rate"
            className={input}
            value={values.rate}
            onChange={set("rate")}
            placeholder="e.g. $8/hr"
          />
        </div>
        <div>
          <label htmlFor="timeZone" className={label}>
            Time Zone
          </label>
          <input
            id="timeZone"
            className={input}
            value={values.timeZone}
            onChange={set("timeZone")}
            placeholder="e.g. EST, PHT, UTC+8"
          />
        </div>
        {select("status", "Status", STATUSES)}
        {select("clientAcquisition", "Client Acquisition", CLIENT_ACQUISITION, true)}

        {(values.status === "Withdrawn" || values.status === "Screened Out") && (
          <div className="sm:col-span-2">
            <label htmlFor="reason" className={label}>
              {values.status === "Withdrawn" ? "Reason for withdrawing" : "Reason screened out"}
            </label>
            <textarea
              id="reason"
              rows={3}
              className={input}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                values.status === "Withdrawn"
                  ? "e.g. Accepted another offer, pay too low, schedule changed, client unresponsive…"
                  : "Why this job didn't meet your rules"
              }
            />
          </div>
        )}

        <div className="border-t border-zinc-200 pt-4 sm:col-span-2 dark:border-zinc-800">
          <p className="text-sm font-semibold">Application draft</p>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            This exact text is what gets sent when you approve it.
          </p>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="emailSubject" className={label}>
            Subject
          </label>
          <input
            id="emailSubject"
            className={input}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Application for [Job Title] | Kim Bandola"
          />
        </div>
        <div className="sm:col-span-2">
          <div className="mb-1.5 flex items-baseline justify-between">
            <label htmlFor="coverLetter" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Cover Letter
            </label>
            <span
              className={`text-xs tabular-nums ${
                words && (words < 150 || words > 250) ? "text-amber-700 dark:text-amber-300" : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              {words} words{words ? " (aim for 150–250)" : ""}
            </span>
          </div>
          <textarea
            id="coverLetter"
            rows={14}
            className={`${input} leading-relaxed`}
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            placeholder="Write or paste the cover letter for this job…"
          />
          {wasApproved && draftChanged && (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
              You already approved this application. Saving these edits moves it back to Pending Review, so you can
              approve the new version with Send.
            </p>
          )}
        </div>

        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 sm:col-span-2 dark:bg-rose-500/10 dark:text-rose-300">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
