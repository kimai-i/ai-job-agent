"use client";

import { LIST_COLUMNS, type JobApplication, type JobFieldKey } from "@/lib/jobs/schema";
import { formatDate } from "@/lib/jobs/format";
import { AcquisitionBadge, StatusBadge } from "./badges";
import { JobLink } from "./job-link";
import { ChevronDownIcon, ChevronUpIcon, PencilIcon, SortIcon, TrashIcon } from "./icons";
import { btn } from "./ui";

export type SortState = { key: JobFieldKey; dir: "asc" | "desc" };

function Cell({ job, k }: { job: JobApplication; k: JobFieldKey }) {
  const v = job[k];
  switch (k) {
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
  sort,
  onSort,
  onView,
  onEdit,
  onDelete,
}: {
  jobs: JobApplication[];
  sort: SortState;
  onSort: (key: JobFieldKey) => void;
  onView: (job: JobApplication) => void;
  onEdit: (job: JobApplication) => void;
  onDelete: (job: JobApplication) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1200px] text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50/80 text-xs text-zinc-500 uppercase dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
          <tr>
            {LIST_COLUMNS.map((c) => {
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
            <th scope="col" className="sticky right-0 bg-zinc-50 px-4 py-3 text-right dark:bg-zinc-900">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {jobs.map((job) => (
            <tr
              key={job.id}
              onClick={() => onView(job)}
              className="group cursor-pointer text-zinc-600 transition-colors hover:bg-indigo-50/40 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
            >
              {LIST_COLUMNS.map((c) => (
                <td key={c.key} className="px-4 py-3 align-middle">
                  <Cell job={job} k={c.key} />
                </td>
              ))}
              <td className="sticky right-0 bg-white px-2 py-3 text-right group-hover:bg-zinc-50 dark:bg-zinc-900 dark:group-hover:bg-zinc-800">
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
