import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function make(paths: string[]) {
  return function Icon(props: IconProps) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="size-4"
        {...props}
      >
        {paths.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    );
  };
}

export const DashboardIcon = make(["M3 3h7v9H3z", "M14 3h7v5h-7z", "M14 12h7v9h-7z", "M3 16h7v5H3z"]);
export const BriefcaseIcon = make([
  "M3 7h18v13H3z",
  "M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
  "M3 13h18",
]);
export const CompassIcon = make(["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "m15.5 8.5-2 5-5 2 2-5z"]);
export const SparklesIcon = make([
  "M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z",
  "M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z",
]);
export const FileTextIcon = make([
  "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z",
  "M14 3v6h6",
  "M8 13h8",
  "M8 17h5",
]);
export const SettingsIcon = make([
  "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  "M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
]);
export const PlusIcon = make(["M12 5v14", "M5 12h14"]);
export const DownloadIcon = make(["M12 3v12", "m7 10 5 5 5-5", "M5 21h14"]);
export const PencilIcon = make(["M4 20h4L19 9l-4-4L4 16z", "m13.5 6.5 4 4"]);
export const TrashIcon = make([
  "M4 7h16",
  "M10 11v6",
  "M14 11v6",
  "M6 7l1 13h10l1-13",
  "M9 7V4h6v3",
]);
export const XIcon = make(["M18 6 6 18", "M6 6l12 12"]);
export const ExternalLinkIcon = make(["M14 4h6v6", "M20 4 10 14", "M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"]);
export const SunIcon = make([
  "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  "M12 2v2",
  "M12 20v2",
  "m4.9 4.9 1.4 1.4",
  "m17.7 17.7 1.4 1.4",
  "M2 12h2",
  "M20 12h2",
  "m4.9 19.1 1.4-1.4",
  "m17.7 6.3 1.4-1.4",
]);
export const MoonIcon = make(["M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"]);
export const MenuIcon = make(["M4 6h16", "M4 12h16", "M4 18h16"]);
export const LogOutIcon = make(["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "m16 17 5-5-5-5", "M21 12H9"]);
export const SearchIcon = make(["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z", "m21 21-4.3-4.3"]);
export const ChevronUpIcon = make(["m18 15-6-6-6 6"]);
export const ChevronDownIcon = make(["m6 9 6 6 6-6"]);
export const SortIcon = make(["m7 15 5 5 5-5", "m7 9 5-5 5 5"]);
export const SendIcon = make(["M22 2 11 13", "M22 2 15 22l-4-9-9-4z"]);
export const ClockIcon = make(["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M12 7v5l3 2"]);
export const CalendarIcon = make(["M4 5h16v16H4z", "M16 3v4", "M8 3v4", "M4 11h16"]);
export const HandshakeIcon = make([
  "m11 17 2 2a1 1 0 1 0 3-3",
  "m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.9-3.9a2 2 0 0 0-2.8 0l-.9.9a1 1 0 1 1-3-3l2.8-2.8a5 5 0 0 1 6.4-.5l.5.3a4 4 0 0 0 2.3.6H21",
  "M21 3v9h-2",
  "M3 3v9h2l5.5 5.5a1 1 0 1 0 3-3",
  "M3 4h8",
]);
export const EyeIcon = make(["M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"]);
export const EyeOffIcon = make([
  "M10.7 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-2.2 3.1",
  "M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6",
  "M9.9 9.9a3 3 0 0 0 4.2 4.2",
  "M2 2l20 20",
]);
export const AlertIcon = make(["M12 9v4", "M12 17h.01", "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"]);
