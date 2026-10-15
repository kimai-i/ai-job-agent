"use client";

import Link from "next/link";
import { useMemo, type ComponentType, type SVGProps } from "react";
import { useJobs } from "@/lib/jobs/use-jobs";
import { STATUSES, STATUS_STYLES, SUBMITTED_STATUSES } from "@/lib/jobs/options";
import { formatDate } from "@/lib/jobs/format";
import { ErrorBanner, PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/badges";
import { ClockIcon, CompassIcon, CalendarIcon, HandshakeIcon, PlusIcon, SendIcon } from "@/components/icons";
import { btn, card } from "@/components/ui";
import { ScriptureBanner } from "@/components/scripture-banner";

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
  loading,
}: {
  label: string;
  value: number;
  hint: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  tone: string;
  loading: boolean;
}) {
  return (
    <div className={`${card} p-5`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
        <span className={`flex size-8 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="size-4" />
        </span>
      </div>
      {loading ? (
        <div className="mt-3 h-8 w-12 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      ) : (
        <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      )}
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
    </div>
  );
}

/** YYYY-MM-DD in Asia/Manila (Kim's reference timezone). */
function manilaDay(value: unknown): string {
  const text = value == null ? "" : String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? "" : MANILA_DAY.format(date);
}
const MANILA_DAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" });

export function DashboardView() {
  const { jobs, loading, error, refresh } = useJobs();

  // The cards count today only (Manila date). The review banner below still
  // shows every draft waiting, whenever it was found.
  const today = manilaDay(new Date().toISOString());
  const stats = useMemo(() => {
    const count = (fn: (j: (typeof jobs)[number]) => boolean) => jobs.filter(fn).length;
    const foundToday = (j: (typeof jobs)[number]) =>
      manilaDay(j.raw.date_discovered ?? j.raw.created_at) === today;
    // When a status was reached: the reply that triggered it, else the last update.
    const changedToday = (j: (typeof jobs)[number]) =>
      manilaDay(j.raw.last_reply_at ?? j.raw.updated_at) === today;
    return {
      discovered: count(foundToday),
      submitted: count((j) => SUBMITTED_STATUSES.includes(j.status) && j.dateApplied === today),
      pendingReview: count((j) => j.status === "Pending Review" && foundToday(j)),
      interviews: count((j) => j.status === "Interview Scheduled" && changedToday(j)),
      acquired: count((j) => j.status === "Hired" && changedToday(j)),
      waiting: count((j) => j.status === "Pending Review"),
    };
  }, [jobs, today]);

  const byStatus = useMemo(
    () => STATUSES.map((s) => ({ status: s, count: jobs.filter((j) => j.status === s).length })),
    [jobs],
  );

  const recent = useMemo(
    () =>
      [...jobs]
        .filter((j) => j.dateApplied)
        .sort((a, b) => b.dateApplied.localeCompare(a.dateApplied))
        .slice(0, 6),
    [jobs],
  );

  const max = Math.max(1, ...byStatus.map((s) => s.count));

  return (
    <>
      <ScriptureBanner />

      <PageHeader
        title="Dashboard"
        description="An overview of every job you are tracking."
        actions={
          <Link href="/applications?new=1" className={btn.primary}>
            <PlusIcon /> Add new job
          </Link>
        }
      />

      {error && <ErrorBanner message={error} onRetry={refresh} />}

      {!loading && stats.waiting > 0 && (
        <Link
          href="/discovery?tab=review"
          className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-4 transition hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20"
        >
          <div>
            <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
              {stats.waiting} application{stats.waiting === 1 ? "" : "s"} ready for your review
            </p>
            <p className="text-sm text-indigo-800/80 dark:text-indigo-300/80">
              Open each one, read the draft, then choose Send or Withdraw.
            </p>
          </div>
          <span className={`${btn.primary} shrink-0`}>Review now</span>
        </Link>
      )}

      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">Today</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {new Date(`${today}T12:00:00`).toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}{" "}
          · Philippine time
        </p>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Jobs Discovered"
          value={stats.discovered}
          hint="Found by the agent today"
          icon={CompassIcon}
          tone="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
          loading={loading}
        />
        <StatCard
          label="Applications Submitted"
          value={stats.submitted}
          hint="Sent today"
          icon={SendIcon}
          tone="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
          loading={loading}
        />
        <StatCard
          label="Pending Review"
          value={stats.pendingReview}
          hint="New drafts from today"
          icon={ClockIcon}
          tone="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
          loading={loading}
        />
        <StatCard
          label="Interviews Scheduled"
          value={stats.interviews}
          hint="Interview invites today"
          icon={CalendarIcon}
          tone="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
          loading={loading}
        />
        <StatCard
          label="Clients Acquired"
          value={stats.acquired}
          hint="Hired today"
          icon={HandshakeIcon}
          tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
          loading={loading}
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-5">
        <div className={`${card} p-5 xl:col-span-2`}>
          <h2 className="text-sm font-semibold">Pipeline by status</h2>
          <ul className="mt-4 space-y-3">
            {byStatus.map(({ status, count }) => (
              <li key={status} className="grid grid-cols-[9.5rem_1fr_2rem] items-center gap-3 text-sm">
                <span className="truncate text-zinc-600 dark:text-zinc-400">{status}</span>
                <span className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <span
                    className={`block h-full rounded-full ${STATUS_STYLES[status].bar} transition-all`}
                    style={{ width: `${(count / max) * 100}%` }}
                  />
                </span>
                <span className="text-right font-medium tabular-nums">{count}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={`${card} xl:col-span-3`}>
          <div className="flex items-center justify-between px-5 pt-5">
            <h2 className="text-sm font-semibold">Recent applications</h2>
            <Link href="/applications" className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
              View all
            </Link>
          </div>
          {!loading && recent.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm font-medium">No applications yet</p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Jobs you add with a date applied will appear here.
              </p>
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
              {recent.map((j) => (
                <li key={j.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{j.jobTitle || "Untitled"}</p>
                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {[j.clientName, j.platform, formatDate(j.dateApplied)].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <StatusBadge value={j.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
