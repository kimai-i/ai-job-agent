"use client";

import { useEffect, useMemo, useState } from "react";
import { useJobs } from "@/lib/jobs/use-jobs";
import { PLATFORMS, STATUSES } from "@/lib/jobs/options";
import type { JobApplication, JobFieldKey } from "@/lib/jobs/schema";
import { downloadJobsCsv } from "@/lib/jobs/csv";
import { ErrorBanner, PageHeader } from "@/components/page-header";
import { JobsTable, type SortState } from "@/components/jobs-table";
import { JobFormModal } from "@/components/job-form-modal";
import { JobDetailsPanel } from "@/components/job-details-panel";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { BriefcaseIcon, DownloadIcon, PlusIcon, SearchIcon } from "@/components/icons";
import { btn, card, input } from "@/components/ui";

const ALL = "all";

function compare(a: JobApplication, b: JobApplication, key: JobFieldKey): number {
  const x = a[key];
  const y = b[key];
  // Empty values always sort last.
  if (!x && !y) return 0;
  if (!x) return 1;
  if (!y) return -1;
  if (key === "rate") {
    const nx = parseFloat(x.replace(/[^\d.]/g, ""));
    const ny = parseFloat(y.replace(/[^\d.]/g, ""));
    if (!Number.isNaN(nx) && !Number.isNaN(ny)) return nx - ny;
  }
  if (key === "status") return STATUSES.indexOf(x as never) - STATUSES.indexOf(y as never);
  return x.localeCompare(y, undefined, { sensitivity: "base", numeric: true });
}

type FormState = { mode: "create" } | { mode: "edit"; job: JobApplication } | null;

export function ApplicationsView() {
  const { jobs, loading, error, sync, refresh, createJob, updateJob, deleteJob, reviewJob } = useJobs();

  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [sort, setSort] = useState<SortState>({ key: "dateApplied", dir: "desc" });

  const [form, setForm] = useState<FormState>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<JobApplication | null>(null);

  // Open the "Add new job" form when arriving from the dashboard button.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "1") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the URL on mount
      setForm({ mode: "create" });
    }
    const statusParam = params.get("status");
    if (statusParam && (STATUSES as readonly string[]).includes(statusParam)) setStatus(statusParam);
    if (params.size) window.history.replaceState(null, "", window.location.pathname);
  }, []);

  const viewing = jobs.find((j) => j.id === viewingId) ?? null;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = jobs.filter((j) => {
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
  }, [jobs, query, platform, status, sort]);

  const filtersActive = query !== "" || platform !== ALL || status !== ALL;

  function toggleSort(key: JobFieldKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }

  return (
    <>
      <PageHeader
        title="Job Applications"
        description="Track every job from discovery to client acquisition."
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
              aria-label="Search job applications"
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
              {STATUSES.map((s) => (
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
              <BriefcaseIcon className="size-6" />
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
            ) : (
              <>
                <p className="mt-4 text-sm font-medium">No job applications yet</p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Add your first job to start tracking it.
                </p>
                <button type="button" className={`${btn.primary} mt-4`} onClick={() => setForm({ mode: "create" })}>
                  <PlusIcon /> Add new job
                </button>
              </>
            )}
          </div>
        ) : (
          <JobsTable
            jobs={visible}
            sort={sort}
            onSort={toggleSort}
            onView={(j) => setViewingId(j.id)}
            onEdit={(j) => setForm({ mode: "edit", job: j })}
            onDelete={setDeleting}
          />
        )}

        {!loading && jobs.length > 0 && (
          <div className="border-t border-zinc-200 px-4 py-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            Showing {visible.length} of {jobs.length} job{jobs.length === 1 ? "" : "s"}
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
              will be permanently removed from your tracker. This can’t be undone.
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
