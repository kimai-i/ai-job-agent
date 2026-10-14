"use client";

import { LIST_COLUMNS, type ColumnKey, type JobApplication } from "@/lib/jobs/schema";
import { formatDate } from "@/lib/jobs/format";
import { AcquisitionBadge, StatusBadge } from "./badges";
import { JobLink } from "./job-link";
import { ChevronDownIcon, ChevronUpIcon, PencilIcon, SortIcon, TrashIcon } from "./icons";
import { btn } from "./ui";

export type SortState = { key: ColumnKey; dir: "asc" | "desc" };

function scoreTone(score: number) {
  if (score >= 75) return "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300";
  if (score >= 60) return "bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300";
  return "bg-zinc-100 text-zinc-600 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-300";
}

function Cell({ job, k }: { job: JobApplication; k: ColumnKey }) {
  const v = job[k];
  switch (k) {
    case "score":
      return v ? (
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums ring-1 ring-inset ${scoreTone(Number(v))}`}>
          {v}
        </span>
      ) : (
        <span className="text-zinc-400">—</span>
      );
    case "status":
      return <StatusBadge value={v} />;
    case "clientAcquisition":
      return <AcquisitionBadge value={v} />;
    case "link":
      return (
        <span className="block max-w-[11rem]">
          <JobLink value={v} />
        </span>
      );
    case "reason":
      return v ? (
        <span className="block max-w-[22rem] truncate" title={v}>
          {v}
        </span>
      ) : (
        <span className="text-zinc-400">—</span>
      );
    case "dateDiscovered":
    case "dateApplied":
      return v ? <span className="whitespace-nowrap">{formatDate(v)}</span> : <span className="text-zinc-400">—</span>;
    case "jobTitle":
      return (
        <span className="block max-w-[18rem] truncate font-medium text-zinc-900 dark:text-zinc-100" title={v}>
          {v || "Untitled"}
        </span>
      );
    default:
      return v ? (
        <span className="block max-w-[12rem] truncate" title={v}>
          {v}
        </span>
      ) : (
        <span className="text-zinc-400">—</span>
      );
  }
}

export function JobsTable({
  jobs,
  columns = LIST_COLUMNS,
  sort,
  onSort,
  onView,
  onEdit,
  onDelete,
}: {
  jobs: JobApplication[];
  columns?: { key: ColumnKey; label: string }[];
  sort: SortState;
  onSort: (key: ColumnKey) => void;
  onView: (job: JobApplication) => void;
  onEdit: (job: JobApplication) => void;
  onDelete: (job: JobApplication) => void;
}) {
  return (
    // The table scrolls inside its own box (both directions) so the header row
    // can stay pinned at the top while rows scroll underneath it.
    <div className="max-h-[calc(100dvh-16rem)] min-h-[18rem] overflow-auto">
      <table className="w-full min-w-[1200px] border-separate border-spacing-0 text-left text-sm">
        <thead className="sticky top-0 z-20 bg-zinc-50 text-xs text-zinc-500 uppercase shadow-[0_1px_0_0_var(--color-zinc-200)] dark:bg-zinc-900 dark:text-zinc-400 dark:shadow-[0_1px_0_0_var(--color-zinc-800)]">
          <tr>
            {columns.map((c) => {
              const active = sort.key === c.key;
              const Icon = !active ? SortIcon : sort.dir === "asc" ? ChevronUpIcon : ChevronDownIcon;
              return (
                <th
                  key={c.key}
                  scope="col"
                  aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
                  className="px-4 py-3 font-semibold tracking-wide whitespace-nowrap"
                >
                  <button
                    type="button"
                    onClick={() => onSort(c.key)}
                    className={`inline-flex items-center gap-1 uppercase hover:text-zinc-900 dark:hover:text-zinc-100 ${active ? "text-zinc-900 dark:text-zinc-100" : ""}`}
                  >
                    {c.label}
                    <Icon className={`size-3.5 ${active ? "" : "opacity-40"}`} />
                  </button>
                </th>
              );
            })}
            <th scope="col" className="sticky right-0 z-30 bg-zinc-50 px-4 py-3 text-right dark:bg-zinc-900">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr
              key={job.id}
              onClick={() => onView(job)}
              className="group cursor-pointer text-zinc-600 transition-colors hover:bg-indigo-50/40 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
            >
              {columns.map((c) => (
                <td key={c.key} className="border-b border-zinc-100 px-4 py-3 align-middle dark:border-zinc-800">
                  <Cell job={job} k={c.key} />
                </td>
              ))}
              <td className="sticky right-0 border-b border-zinc-100 bg-white px-2 py-3 text-right group-hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:group-hover:bg-zinc-800">
                <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                  <button type="button" className={btn.icon} onClick={() => onEdit(job)} aria-label={`Edit ${job.jobTitle}`}>
                    <PencilIcon />
                  </button>
                  <button
                    type="button"
                    className={`${btn.icon} hover:text-rose-600 dark:hover:text-rose-400`}
                    onClick={() => onDelete(job)}
                    aria-label={`Delete ${job.jobTitle}`}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
