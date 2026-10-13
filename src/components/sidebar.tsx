"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  BriefcaseIcon,
  CompassIcon,
  DashboardIcon,
  FileTextIcon,
  LogOutIcon,
  MenuIcon,
  SettingsIcon,
  SparklesIcon,
  XIcon,
} from "./icons";
import { ThemeToggle } from "./theme-toggle";
import { btn } from "./ui";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/applications", label: "Job Applications", icon: BriefcaseIcon },
  { href: "/discovery", label: "Job Discovery", icon: CompassIcon },
  { href: "/qualification", label: "AI Qualification", icon: SparklesIcon, soon: true },
  { href: "/cover-letters", label: "Cover Letters", icon: FileTextIcon, soon: true },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export async function signOut(router: ReturnType<typeof useRouter>) {
  await createClient().auth.signOut();
  router.replace("/login");
  router.refresh();
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
        <SparklesIcon className="size-4" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold">AI Job Agent</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Application tracker</p>
      </div>
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon, soon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            }`}
          >
            <Icon className="size-4 shrink-0" />
            <span className="flex-1">{label}</span>
            {soon && (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-zinc-500 uppercase dark:bg-zinc-800 dark:text-zinc-400">
                Soon
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function UserFooter() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  return (
    <div className="flex items-center gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700 uppercase dark:bg-zinc-800 dark:text-zinc-300">
        {email.slice(0, 1) || "·"}
      </div>
      <p className="min-w-0 flex-1 truncate text-xs text-zinc-600 dark:text-zinc-400" title={email}>
        {email || "Signed in"}
      </p>
      <ThemeToggle className={btn.icon} />
      <button type="button" className={btn.icon} onClick={() => signOut(router)} aria-label="Sign out" title="Sign out">
        <LogOutIcon />
      </button>
    </div>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden dark:border-zinc-800 dark:bg-zinc-900/90">
        <Brand />
        <button type="button" className={btn.icon} onClick={() => setOpen(true)} aria-label="Open navigation">
          <MenuIcon className="size-5" />
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-zinc-950/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col gap-6 bg-white p-4 shadow-xl dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <Brand />
              <button type="button" className={btn.icon} onClick={() => setOpen(false)} aria-label="Close navigation">
                <XIcon />
              </button>
            </div>
            <div className="flex-1">
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
            <UserFooter />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col gap-8 border-r border-zinc-200 bg-white px-4 py-5 lg:flex dark:border-zinc-800 dark:bg-zinc-900">
        <Brand />
        <div className="flex-1">
          <NavLinks />
        </div>
        <UserFooter />
      </aside>
    </>
  );
}
