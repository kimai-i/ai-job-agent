"use client";

import { useState } from "react";
import type { JobApplication } from "@/lib/jobs/schema";
import { ConfirmDialog } from "./confirm-dialog";
import { SendIcon, XIcon } from "./icons";
import { btn } from "./ui";

export type ReviewDecision = "send" | "withdraw" | "cancel-send";

function text(job: JobApplication, column: string): string {
  const v = job.raw[column];
  return v === null || v === undefined ? "" : String(v);
}

function Field({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="mt-0.5 text-sm break-words whitespace-pre-wrap text-zinc-900 dark:text-zinc-100">{value}</dd>
    </div>
  );
}

/** Draft review for Pending Review jobs: read the application, then Send or Withdraw. */
export function ReviewCard({
  job,
  onReview,
}: {
  job: JobApplication;
  onReview: (decision: ReviewDecision) => Promise<unknown>;
}) {
  const [confirming, setConfirming] = useState<ReviewDecision | null>(null);
  const [showNotes, setShowNotes] = useState(false);

  const coverLetter = text(job, "cover_letter");
  const points = text(job, "olj_points");
  const approvedAt = text(job, "approved_at");
  const notes = text(job, "qualification_notes");
  const approved = job.status === "Approved to Send";

  const dialog =
    confirming === "send"
      ? {
          title: "Send this application?",
          message: (
            <>
              This approves this exact application to{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{job.clientName || "the employer"}</span>{" "}
              on {job.platform}
              {points ? `, using ${points} OLJ points` : ""}. It is submitted the next time you type{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">&ldquo;send approved&rdquo;</span> in
              Claude. If anything on the posting has changed by then, it won&rsquo;t be sent and you&rsquo;ll be told
              why.
            </>
          ),
          confirmLabel: "Send",
          busyLabel: "Approving…",
          tone: "primary" as const,
        }
      : confirming === "withdraw"
        ? {
            title: "Withdraw this application?",
            message: "Nothing will be sent to this employer. The job stays in your tracker as Withdrawn.",
            confirmLabel: "Withdraw",
            busyLabel: "Withdrawing…",
            tone: "danger" as const,
          }
        : confirming === "cancel-send"
          ? {
              title: "Cancel sending?",
              message: "The application goes back to Pending Review and will not be sent.",
              confirmLabel: "Cancel sending",
              busyLabel: "Cancelling…",
              tone: "danger" as const,
            }
          : null;

  return (
    <section className="mt-5 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-500/30 dark:bg-indigo-500/5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{approved ? "Approved: waiting to be sent" : "Ready for your review"}</h3>
        {text(job, "ai_match_score") && (
          <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200 dark:bg-zinc-900 dark:text-indigo-300 dark:ring-indigo-500/30">
            Match {text(job, "ai_match_score")}/100
          </span>
        )}
      </div>

      <dl className="mt-3 space-y-3">
        <Field label="Subject" value={text(job, "email_subject")} />
        <Field label="Your asking rate" value={text(job, "expected_rate")} />
        <Field label="Application method" value={text(job, "application_method")} />
        <Field label="OLJ points" value={points} />
        <Field label="Employer instructions" value={text(job, "application_instructions")} />
      </dl>

      {coverLetter ? (
        <div className="mt-4">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Cover letter</p>
          <div className="mt-1 rounded-lg border border-zinc-200 bg-white p-3 text-sm leading-relaxed whitespace-pre-wrap dark:border-zinc-700 dark:bg-zinc-900">
            {coverLetter}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-amber-800 dark:text-amber-300">No cover letter was drafted for this job.</p>
      )}

      {notes && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowNotes((s) => !s)}
            className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            {showNotes ? "Hide" : "Show"} eligibility review
          </button>
          {showNotes && (
            <pre className="mt-2 rounded-lg bg-white p-3 font-sans text-xs whitespace-pre-wrap text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              {notes}
            </pre>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {approved ? (
          <>
            <p className="w-full text-sm text-zinc-600 dark:text-zinc-300">
              Approved {approvedAt ? new Date(approvedAt).toLocaleString() : ""}. To submit it, type{" "}
              <span className="font-medium">&ldquo;send approved&rdquo;</span> in Claude on your computer.
            </p>
            <button type="button" className={btn.secondary} onClick={() => setConfirming("cancel-send")}>
              <XIcon /> Cancel sending
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className={`${btn.primary} flex-1`}
              onClick={() => setConfirming("send")}
              disabled={!coverLetter}
            >
              <SendIcon /> Send
            </button>
            <button type="button" className={`${btn.secondary} flex-1`} onClick={() => setConfirming("withdraw")}>
              <XIcon /> Withdraw
            </button>
          </>
        )}
      </div>

      {dialog && confirming && (
        <ConfirmDialog
          title={dialog.title}
          message={dialog.message}
          confirmLabel={dialog.confirmLabel}
          busyLabel={dialog.busyLabel}
          tone={dialog.tone}
          onConfirm={async () => {
            await onReview(confirming);
          }}
          onClose={() => setConfirming(null)}
        />
      )}
    </section>
  );
}
