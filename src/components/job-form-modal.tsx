"use client";

import { useState, type FormEvent } from "react";
import { CLIENT_ACQUISITION, JOB_TYPES, PLATFORMS, STATUSES } from "@/lib/jobs/options";
import type { JobApplication, JobFieldKey, JobFormValues } from "@/lib/jobs/schema";
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
  onSubmit: (values: JobFormValues) => Promise<unknown>;
  onClose: () => void;
}) {
  const [values, setValues] = useState<JobFormValues>(() => {
    if (!job) return EMPTY;
    const v = { ...EMPTY };
    for (const k of Object.keys(EMPTY) as JobFieldKey[]) v[k] = job[k];
    return v;
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    try {
      await onSubmit(values);
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
        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 sm:col-span-2 dark:bg-rose-500/10 dark:text-rose-300">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
