import { LIST_COLUMNS, type JobApplication } from "./schema";
import { todayIso } from "./format";

function escapeCell(value: string): string {
  // Neutralise spreadsheet formula injection, then quote.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function downloadJobsCsv(jobs: JobApplication[]) {
  const header = LIST_COLUMNS.map((c) => escapeCell(c.label)).join(",");
  const lines = jobs.map((job) =>
    LIST_COLUMNS.map((c) => escapeCell(job[c.key])).join(","),
  );
  // BOM so Excel detects UTF-8.
  const blob = new Blob(["﻿" + [header, ...lines].join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `job-applications-${todayIso()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
