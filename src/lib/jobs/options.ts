export const PLATFORMS = [
  "OnlineJobs.ph",
  "LinkedIn",
  "Indeed",
  "Direct Application",
  "Other",
] as const;

export const JOB_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Freelance",
  "Project-based",
] as const;

export const STATUSES = [
  "Discovered",
  "Qualified",
  "Needs Information",
  "Video Required",
  "External Application",
  "Drafted",
  "Pending Review",
  "Submission Failed",
  "Applied",
  "Interview Scheduled",
  "Rejected",
  "Offer Received",
  "Hired",
  "Screened Out",
] as const;

/** How the client was acquired. Optional; empty until known. */
export const CLIENT_ACQUISITION = ["Honoring", "Partnership", "Referral", "B2B"] as const;

/** Statuses that mean the application has actually been sent. */
export const SUBMITTED_STATUSES: readonly string[] = [
  "Applied",
  "Interview Scheduled",
  "Rejected",
  "Offer Received",
  "Hired",
];

const NEUTRAL =
  "bg-zinc-100 text-zinc-700 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-400/20";

export const STATUS_STYLES: Record<string, { badge: string; bar: string }> = {
  Discovered: { badge: NEUTRAL, bar: "bg-zinc-400" },
  Qualified: {
    badge: "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/30",
    bar: "bg-sky-500",
  },
  Drafted: {
    badge: "bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-400/30",
    bar: "bg-violet-500",
  },
  "Pending Review": {
    badge: "bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/30",
    bar: "bg-amber-500",
  },
  Applied: {
    badge: "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-400/30",
    bar: "bg-blue-500",
  },
  "Interview Scheduled": {
    badge: "bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-400/30",
    bar: "bg-indigo-500",
  },
  Rejected: {
    badge: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/30",
    bar: "bg-rose-500",
  },
  "Offer Received": {
    badge: "bg-teal-50 text-teal-700 ring-teal-600/20 dark:bg-teal-500/10 dark:text-teal-300 dark:ring-teal-400/30",
    bar: "bg-teal-500",
  },
  Hired: {
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/30",
    bar: "bg-emerald-500",
  },
  "Needs Information": {
    badge: "bg-orange-50 text-orange-800 ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-400/30",
    bar: "bg-orange-500",
  },
  "Video Required": {
    badge: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-600/20 dark:bg-fuchsia-500/10 dark:text-fuchsia-300 dark:ring-fuchsia-400/30",
    bar: "bg-fuchsia-500",
  },
  "External Application": {
    badge: "bg-cyan-50 text-cyan-800 ring-cyan-600/20 dark:bg-cyan-500/10 dark:text-cyan-300 dark:ring-cyan-400/30",
    bar: "bg-cyan-500",
  },
  "Submission Failed": {
    badge: "bg-red-100 text-red-800 ring-red-700/30 dark:bg-red-500/20 dark:text-red-200 dark:ring-red-400/40",
    bar: "bg-red-600",
  },
  "Screened Out": { badge: NEUTRAL, bar: "bg-zinc-300 dark:bg-zinc-600" },
};

export const ACQUISITION_STYLES: Record<string, string> = {
  Honoring: STATUS_STYLES.Drafted.badge,
  Partnership: STATUS_STYLES.Qualified.badge,
  Referral: STATUS_STYLES["Pending Review"].badge,
  B2B: STATUS_STYLES["Offer Received"].badge,
};

export const NEUTRAL_BADGE = NEUTRAL;
