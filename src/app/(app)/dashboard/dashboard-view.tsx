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

export function DashboardView() {
  const { jobs, loading, error, refresh } = useJobs();

  const stats = useMemo(() => {
    const count = (fn: (j: (typeof jobs)[number]) => boolean) => jobs.filter(fn).length;
    return {
      discovered: jobs.length,
      submitted: count((j) => SUBMITTED_STATUSES.includes(j.status)),
      pendingReview: count((j) => j.status === "Pending Review"),
      interviews: count((j) => j.status === "Interview Scheduled"),
      acquired: count((j) => j.status === "Hired"),
    };
  }, [jobs]);

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
      <figure className="mb-8 rounded-xl border border-amber-200 bg-amber-50/70 px-5 py-4 dark:border-amber-500/20 dark:bg-amber-500/5">
        <blockquote className="space-y-2 font-serif text-[15px] leading-relaxed text-zinc-800 italic dark:text-zinc-200">
          <p>
            <sup className="mr-1 font-sans text-[10px] text-amber-700 not-italic dark:text-amber-400">19</sup>
            &ldquo;All this,&rdquo; David said, &ldquo;I have in writing as a result of the L
            <span className="text-[0.8em]">ORD</span>&rsquo;s hand on me, and he enabled me to understand all the
            details of the plan.&rdquo;
          </p>
          <p>
            <sup className="mr-1 font-sans text-[10px] text-amber-700 not-italic dark:text-amber-400">20</sup>
            David also said to Solomon his son, &ldquo;Be strong and courageous, and do the work. Do not be afraid
            or discouraged, for the L<span className="text-[0.8em]">ORD</span> God, my God, is with you. He will not
            fail you or forsake you until all the work for the service of the temple of the L
            <span className="text-[0.8em]">ORD</span> is finished.
          </p>
          <p>
            <sup className="mr-1 font-sans text-[10px] text-amber-700 not-italic dark:text-amber-400">21</sup>
            The divisions of the priests and Levites are ready for all the work on the temple of God, and every
            willing person skilled in any craft will help you in all the work. The officials and all the people will
            obey your every command.&rdquo;
          </p>
        </blockquote>
        <figcaption className="mt-3 text-xs font-semibold tracking-wide text-amber-800 uppercase dark:text-amber-300">
          1 Chronicles 28:19&ndash;21 (NIV)
        </figcaption>
      </figure>

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

      {!loading && stats.pendingReview > 0 && (
        <Link
          href="/discovery?tab=review"
          className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-4 transition hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20"
        >
          <div>
            <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
              {stats.pendingReview} application{stats.pendingReview === 1 ? "" : "s"} ready for your review
            </p>
            <p className="text-sm text-indigo-800/80 dark:text-indigo-300/80">
              Open each one, read the draft, then choose Send or Withdraw.
            </p>
          </div>
          <span className={`${btn.primary} shrink-0`}>Review now</span>
        </Link>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Jobs Discovered"
          value={stats.discovered}
          hint="All jobs being tracked"
          icon={CompassIcon}
          tone="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
          loading={loading}
        />
        <StatCard
          label="Applications Submitted"
          value={stats.submitted}
          hint="Applied or further along"
          icon={SendIcon}
          tone="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
          loading={loading}
        />
        <StatCard
          label="Pending Review"
          value={stats.pendingReview}
          hint="Waiting for your review"
          icon={ClockIcon}
          tone="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
          loading={loading}
        />
        <StatCard
          label="Interviews Scheduled"
          value={stats.interviews}
          hint="Status: Interview Scheduled"
          icon={CalendarIcon}
          tone="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
          loading={loading}
        />
        <StatCard
          label="Clients Acquired"
          value={stats.acquired}
          hint="Status: Hired"
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
