"use client";

import { useEffect, useMemo, useState } from "react";
import { useJobs } from "@/lib/jobs/use-jobs";
import { DISCOVERY_TABS, PLATFORMS, STATUSES, SUBMITTED_STATUSES, type DiscoveryTabId } from "@/lib/jobs/options";
import { DISCOVERY_COLUMNS, LIST_COLUMNS, type ColumnKey, type JobApplication } from "@/lib/jobs/schema";
import { downloadJobsCsv } from "@/lib/jobs/csv";
import { ErrorBanner, PageHeader } from "./page-header";
import { JobsTable, type SortState } from "./jobs-table";
import { JobFormModal } from "./job-form-modal";
import { JobDetailsPanel } from "./job-details-panel";
import { ConfirmDialog } from "./confirm-dialog";
import { BriefcaseIcon, CompassIcon, DownloadIcon, PlusIcon, SearchIcon } from "./icons";
import { btn, card, input } from "./ui";

const ALL = "all";

function compare(a: JobApplication, b: JobApplication, key: ColumnKey): number {
  const x = a[key];
  const y = b[key];
  // Empty values always sort last.
  if (!x && !y) return 0;
  if (!x) return 1;
  if (!y) return -1;
  if (key === "rate" || key === "score") {
    const nx = parseFloat(x.replace(/[^\d.]/g, ""));
    const ny = parseFloat(y.replace(/[^\d.]/g, ""));
    if (!Number.isNaN(nx) && !Number.isNaN(ny)) return nx - ny;
  }
  if (key === "status") return STATUSES.indexOf(x as never) - STATUSES.indexOf(y as never);
  return x.localeCompare(y, undefined, { sensitivity: "base", numeric: true });
}

type FormState = { mode: "create" } | { mode: "edit"; job: JobApplication } | null;

/**
 * Job Applications (mode "applications") shows jobs that were actually sent.
 * Job Discovery (mode "discovery") shows everything found but not yet sent,
 * split into Ready for review / Needs action / Not pursued tabs.
 */
export function JobsBoard({ mode }: { mode: "applications" | "discovery" }) {
  const { jobs, loading, error, sync, refresh, createJob, updateJob, deleteJob, reviewJob } = useJobs();
  const discovery = mode === "discovery";

  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [tab, setTab] = useState<DiscoveryTabId>("review");
  const [sort, setSort] = useState<SortState>(
    discovery ? { key: "score", dir: "desc" } : { key: "dateApplied", dir: "desc" },
  );

  const [form, setForm] = useState<FormState>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<JobApplication | null>(null);

  // Deep links: ?new=1 opens the add form, ?tab= picks a Discovery tab, ?status= filters.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "1") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the URL on mount
      setForm({ mode: "create" });
    }
    const tabParam = params.get("tab");
    if (tabParam && DISCOVERY_TABS.some((t) => t.id === tabParam)) setTab(tabParam as DiscoveryTabId);
    const statusParam = params.get("status");
    if (statusParam && (STATUSES as readonly string[]).includes(statusParam)) setStatus(statusParam);
    if (params.size) window.history.replaceState(null, "", window.location.pathname);
  }, []);

  // Jobs that belong on this page at all.
  const pageJobs = useMemo(
    () =>
      jobs.filter((j) =>
        discovery ? !SUBMITTED_STATUSES.includes(j.status) : SUBMITTED_STATUSES.includes(j.status),
      ),
    [jobs, discovery],
  );

  const tabCounts = useMemo(
    () =>
      Object.fromEntries(
        DISCOVERY_TABS.map((t) => [t.id, pageJobs.filter((j) => (t.statuses as readonly string[]).includes(j.status)).length]),
      ) as Record<DiscoveryTabId, number>,
    [pageJobs],
  );

  const activeTab = DISCOVERY_TABS.find((t) => t.id === tab)!;
  const tabJobs = useMemo(
    () => (discovery ? pageJobs.filter((j) => (activeTab.statuses as readonly string[]).includes(j.status)) : pageJobs),
    [discovery, pageJobs, activeTab],
  );
  const statusOptions = discovery
    ? (activeTab.statuses as readonly string[])
    : STATUSES.filter((s) => SUBMITTED_STATUSES.includes(s));

  const viewing = jobs.find((j) => j.id === viewingId) ?? null;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = tabJobs.filter((j) => {
      if (platform !== ALL && j.platform !== platform) return false;
      if (status !== ALL && j.status !== status) return false;
      if (!q) return true;
      return [j.jobTitle, j.clientName, j.platform, j.link, j.rate, j.timeZone, j.jobType, j.status]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
    const dir = sort.dir === "asc" ? 1 : -1;
    return filtered.sort((a, b) => {
      const c = compare(a, b, sort.key);
      // Keep empties last regardless of direction.
      if (!a[sort.key] || !b[sort.key]) return c;
      return c * dir;
    });
  }, [tabJobs, query, platform, status, sort]);

  const filtersActive = query !== "" || platform !== ALL || status !== ALL;

  function toggleSort(key: ColumnKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }

  return (
    <>
      <PageHeader
        title={discovery ? "Job Discovery" : "Job Applications"}
        description={
          discovery
            ? "Jobs the agent found that haven't been sent yet. Review each draft, then Send or Withdraw."
            : "Applications you've sent, from Applied through to client acquisition."
        }
        actions={
          <>
            <button
              type="button"
              className={btn.secondary}
              onClick={() => downloadJobsCsv(visible)}
              disabled={visible.length === 0}
              title="Exports the rows currently shown"
            >
              <DownloadIcon /> Export CSV
            </button>
            <button type="button" className={btn.primary} onClick={() => setForm({ mode: "create" })}>
              <PlusIcon /> Add new job
            </button>
          </>
        }
      />

      {error && <ErrorBanner message={error} onRetry={refresh} />}

      {sync && (sync.inserted > 0 || sync.updated > 0 || sync.errors.length > 0) && (
        <div
          className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
            sync.errors.length
              ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
              : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
          }`}
        >
          <p>
            <span className="font-semibold">Job agent sync:</span> {sync.inserted} new, {sync.updated} updated.
          </p>
          {sync.errors.length > 0 && (
            <ul className="mt-1 list-disc pl-5">
              {sync.errors.slice(0, 5).map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {discovery && (
        <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-zinc-100 p-1 dark:bg-zinc-900" role="tablist">
          {DISCOVERY_TABS.map((t) => {
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setTab(t.id);
                  setStatus(ALL);
                }}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                }`}
              >
                {t.label}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${
                    active && t.id === "review" && tabCounts[t.id] > 0
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"
                  }`}
                >
                  {tabCounts[t.id]}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className={card}>
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 md:flex-row md:items-center dark:border-zinc-800">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, client, rate, time zone…"
              className={`${input} pl-9`}
              aria-label={discovery ? "Search discovered jobs" : "Search job applications"}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 md:flex">
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className={`${input} md:w-48`}
              aria-label="Filter by platform"
            >
              <option value={ALL}>All platforms</option>
              {PLATFORMS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={`${input} md:w-48`}
              aria-label="Filter by status"
            >
              <option value={ALL}>All statuses</option>
              {statusOptions.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 p-4" aria-label="Loading">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {discovery ? <CompassIcon className="size-6" /> : <BriefcaseIcon className="size-6" />}
            </div>
            {filtersActive ? (
              <>
                <p className="mt-4 text-sm font-medium">No jobs match your filters</p>
                <button
                  type="button"
                  className="mt-2 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                  onClick={() => {
                    setQuery("");
                    setPlatform(ALL);
                    setStatus(ALL);
                  }}
                >
                  Clear filters
                </button>
              </>
            ) : discovery ? (
              <p className="mt-4 text-sm font-medium">{activeTab.empty}</p>
            ) : (
              <>
                <p className="mt-4 text-sm font-medium">No sent applications yet</p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Jobs appear here once they&rsquo;re sent and marked Applied. Review new drafts in Job Discovery.
                </p>
              </>
            )}
          </div>
        ) : (
          <JobsTable
            jobs={visible}
            columns={discovery ? DISCOVERY_COLUMNS : LIST_COLUMNS}
            sort={sort}
            onSort={toggleSort}
            onView={(j) => setViewingId(j.id)}
            onEdit={(j) => setForm({ mode: "edit", job: j })}
            onDelete={setDeleting}
          />
        )}

        {!loading && tabJobs.length > 0 && (
          <div className="border-t border-zinc-200 px-4 py-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            Showing {visible.length} of {tabJobs.length} job{tabJobs.length === 1 ? "" : "s"}
          </div>
        )}
      </div>

      {viewing && (
        <JobDetailsPanel
          job={viewing}
          onClose={() => setViewingId(null)}
          onEdit={() => setForm({ mode: "edit", job: viewing })}
          onDelete={() => setDeleting(viewing)}
          onReview={(decision) => reviewJob(viewing.id, decision)}
        />
      )}

      {form && (
        <JobFormModal
          job={form.mode === "edit" ? form.job : undefined}
          onSubmit={(values) => (form.mode === "edit" ? updateJob(form.job.id, values) : createJob(values))}
          onClose={() => setForm(null)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete job?"
          message={
            <>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {deleting.jobTitle || "This job"}
              </span>{" "}
              will be permanently removed from your tracker. This can&rsquo;t be undone.
            </>
          }
          onConfirm={async () => {
            await deleteJob(deleting.id);
            if (viewingId === deleting.id) setViewingId(null);
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  );
}
