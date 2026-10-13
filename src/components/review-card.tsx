"use client";

import { useState } from "react";
import type { JobApplication } from "@/lib/jobs/schema";
import { safeHref } from "@/lib/jobs/format";
import type { ReviewDecision } from "@/lib/jobs/use-jobs";
import { ConfirmDialog } from "./confirm-dialog";
import { ExternalLinkIcon, PencilIcon, SendIcon, XIcon } from "./icons";
import { btn, input } from "./ui";

export type { ReviewDecision };

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={btn.secondary}
      disabled={!text}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          // Clipboard blocked: the text is still visible above to copy by hand.
        }
      }}
    >
      {copied ? "Copied ✓" : label}
    </button>
  );
}

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
  onSaveDraft,
}: {
  job: JobApplication;
  onReview: (decision: ReviewDecision) => Promise<unknown>;
  onSaveDraft?: (draft: { email_subject: string; cover_letter: string }) => Promise<unknown>;
}) {
  const [confirming, setConfirming] = useState<ReviewDecision | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftSubject, setDraftSubject] = useState("");
  const [draftLetter, setDraftLetter] = useState("");
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const draftWords = draftLetter.trim() ? draftLetter.trim().split(/\s+/).length : 0;

  function startEditing() {
    setDraftSubject(text(job, "email_subject"));
    setDraftLetter(text(job, "cover_letter"));
    setDraftError(null);
    setEditing(true);
  }

  async function saveEdits() {
    if (!onSaveDraft) return;
    setSavingDraft(true);
    setDraftError(null);
    try {
      await onSaveDraft({ email_subject: draftSubject, cover_letter: draftLetter });
      setEditing(false);
    } catch (e) {
      setDraftError((e as Error).message);
    } finally {
      setSavingDraft(false);
    }
  }

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
              {points ? `, using ${points} OLJ points` : ""}. To submit it, either use{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">Send it yourself</span> below (instant,
              no Claude needed), or ask Claude to send your approved applications. Once it&rsquo;s sent and marked
              Applied, it moves from Job Discovery to Job Applications.
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
          : confirming === "mark-applied"
            ? {
                title: "Did you send it?",
                message:
                  "Only confirm after you've clicked Send on the job site and seen its confirmation. The job moves to Job Applications with today's date.",
                confirmLabel: "Yes, mark Applied",
                busyLabel: "Saving…",
                tone: "primary" as const,
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

      {editing ? (
        <div className="mt-3 space-y-3">
          <div>
            <label htmlFor="review-subject" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Subject
            </label>
            <input
              id="review-subject"
              className={`${input} mt-1`}
              value={draftSubject}
              onChange={(e) => setDraftSubject(e.target.value)}
            />
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor="review-letter" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Cover letter
              </label>
              <span className="text-xs text-zinc-500 tabular-nums dark:text-zinc-400">{draftWords} words</span>
            </div>
            <textarea
              id="review-letter"
              rows={14}
              className={`${input} mt-1 leading-relaxed`}
              value={draftLetter}
              onChange={(e) => setDraftLetter(e.target.value)}
            />
          </div>
          {approved && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
              Saving edits moves this back to Pending Review so you can approve the new version.
            </p>
          )}
          {draftError && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
              {draftError}
            </p>
          )}
          <div className="flex gap-2">
            <button type="button" className={btn.primary} onClick={saveEdits} disabled={savingDraft}>
              {savingDraft ? "Saving…" : "Save changes"}
            </button>
            <button type="button" className={btn.secondary} onClick={() => setEditing(false)} disabled={savingDraft}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
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

          {onSaveDraft && (
            <button
              type="button"
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
              onClick={startEditing}
            >
              <PencilIcon className="size-3.5" /> Edit subject &amp; cover letter
            </button>
          )}
        </>
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
              Approved {approvedAt ? new Date(approvedAt).toLocaleString() : ""}. Submit it with{" "}
              <span className="font-medium">Send it yourself</span> below, or ask Claude to send it.
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

      <div className="mt-4 border-t border-indigo-200 pt-4 dark:border-indigo-500/30">
        <p className="text-sm font-semibold">Send it yourself (no Claude needed)</p>
        <ol className="mt-1 list-decimal pl-5 text-xs text-zinc-600 dark:text-zinc-400">
          <li>Open the posting and click its Apply button.</li>
          <li>Paste the subject and cover letter{points ? `, set ${points} points` : ""}, and send it there.</li>
          <li>Come back and mark it Applied.</li>
        </ol>
        <div className="mt-3 flex flex-wrap gap-2">
          {safeHref(job.link) && (
            <a href={safeHref(job.link)!} target="_blank" rel="noopener noreferrer" className={btn.secondary}>
              <ExternalLinkIcon /> Open job posting
            </a>
          )}
          <CopyButton text={text(job, "email_subject")} label="Copy subject" />
          <CopyButton text={coverLetter} label="Copy cover letter" />
          <button type="button" className={btn.primary} onClick={() => setConfirming("mark-applied")}>
            I sent it – mark Applied
          </button>
        </div>
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
