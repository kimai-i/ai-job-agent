"use client";

import { MoonIcon, SunIcon } from "./icons";

export function setTheme(theme: "light" | "dark") {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem("theme", theme);
  } catch {
    // Storage unavailable; the theme still applies for this page view.
  }
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        const dark = document.documentElement.getAttribute("data-theme") === "dark";
        setTheme(dark ? "light" : "dark");
      }}
      className={className}
      aria-label="Toggle light / dark mode"
      title="Toggle light / dark mode"
    >
      <SunIcon className="size-4 dark:hidden" />
      <MoonIcon className="hidden size-4 dark:block" />
    </button>
  );
}
