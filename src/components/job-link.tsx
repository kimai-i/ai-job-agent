import { displayHost, safeHref } from "@/lib/jobs/format";
import { ExternalLinkIcon } from "./icons";

export function JobLink({ value, full = false }: { value: string; full?: boolean }) {
  if (!value) return <span className="text-zinc-400">—</span>;
  const href = safeHref(value);
  if (!href) return <span className="break-all">{value}</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex max-w-full items-center gap-1 font-medium text-indigo-600 hover:text-indigo-500 hover:underline dark:text-indigo-400"
      title={href}
    >
      <span className={full ? "break-all" : "truncate"}>{full ? href : displayHost(href)}</span>
      <ExternalLinkIcon className="size-3.5 shrink-0" />
    </a>
  );
}
