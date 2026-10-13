import type { ComponentType, SVGProps } from "react";
import { PageHeader } from "./page-header";
import { card } from "./ui";

export function ComingSoon({
  title,
  description,
  icon: Icon,
  planned,
}: {
  title: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  planned: string[];
}) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <div className={`${card} flex flex-col items-center px-6 py-14 text-center`}>
        <div className="flex size-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
          <Icon className="size-6" />
        </div>
        <span className="mt-4 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-600/20 ring-inset dark:bg-amber-500/10 dark:text-amber-300">
          Coming soon
        </span>
        <h2 className="mt-3 text-lg font-semibold">Planned for a later phase</h2>
        <p className="mt-1 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
          This module is not active yet. No automated searching, drafting or sending happens in this version.
        </p>
        <ul className="mt-6 grid w-full max-w-md gap-2 text-left text-sm">
          {planned.map((p) => (
            <li
              key={p}
              className="flex items-center gap-2 rounded-lg border border-dashed border-zinc-200 px-3 py-2 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
            >
              <span className="size-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
              {p}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
