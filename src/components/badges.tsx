import { ACQUISITION_STYLES, NEUTRAL_BADGE, STATUS_STYLES } from "@/lib/jobs/options";

const BASE =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset";

export function StatusBadge({ value }: { value: string }) {
  if (!value) return <span className="text-zinc-400">—</span>;
  const style = STATUS_STYLES[value];
  return (
    <span className={`${BASE} ${style?.badge ?? NEUTRAL_BADGE}`}>
      <span className={`size-1.5 rounded-full ${style?.bar ?? "bg-zinc-400"}`} />
      {value}
    </span>
  );
}

export function AcquisitionBadge({ value }: { value: string }) {
  if (!value) return <span className="text-zinc-400">—</span>;
  return <span className={`${BASE} ${ACQUISITION_STYLES[value] ?? NEUTRAL_BADGE}`}>{value}</span>;
}
