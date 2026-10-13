"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { supabaseHost } from "@/lib/supabase/env";
import { TABLE } from "@/lib/jobs/schema";
import { PageHeader } from "@/components/page-header";
import { setTheme } from "@/components/theme-toggle";
import { signOut } from "@/components/sidebar";
import { LogOutIcon, MoonIcon, SunIcon } from "@/components/icons";
import { btn, card } from "@/components/ui";

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className={`${card} grid gap-4 p-5 md:grid-cols-3`}>
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>
      <div className="md:col-span-2">{children}</div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-2 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="text-sm font-medium break-all">{value}</span>
    </div>
  );
}

type Connection = { state: "checking" } | { state: "ok"; rows: number } | { state: "error"; message: string };

export function SettingsView() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; confirmed: boolean; lastSignIn: string } | null>(null);
  const [connection, setConnection] = useState<Connection>({ state: "checking" });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user)
        setUser({
          email: data.user.email ?? "",
          confirmed: Boolean(data.user.email_confirmed_at),
          lastSignIn: data.user.last_sign_in_at ?? "",
        });
    });
    supabase
      .from(TABLE)
      .select("*", { count: "exact", head: true })
      .then(({ count, error }) =>
        setConnection(error ? { state: "error", message: error.message } : { state: "ok", rows: count ?? 0 }),
      );
  }, []);

  return (
    <>
      <PageHeader title="Settings" description="Your account, appearance and data connection." />
      <div className="space-y-6">
        <Section title="Account" description="The Supabase account you are signed in with.">
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            <Field label="Email" value={user?.email || "…"} />
            <Field label="Email confirmed" value={user ? (user.confirmed ? "Yes" : "No") : "…"} />
            <Field
              label="Last sign-in"
              value={user?.lastSignIn ? new Date(user.lastSignIn).toLocaleString() : "…"}
            />
          </div>
          <button type="button" className={`${btn.secondary} mt-4`} onClick={() => signOut(router)}>
            <LogOutIcon /> Sign out
          </button>
        </Section>

        <Section title="Appearance" description="Choose light or dark mode. Saved on this device.">
          <div className="flex gap-2">
            <button type="button" className={btn.secondary} onClick={() => setTheme("light")}>
              <SunIcon /> Light
            </button>
            <button type="button" className={btn.secondary} onClick={() => setTheme("dark")}>
              <MoonIcon /> Dark
            </button>
          </div>
        </Section>

        <Section
          title="Data connection"
          description="Job data is stored in Supabase and protected by Row Level Security."
        >
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            <Field label="Supabase project" value={supabaseHost() || "Not configured"} />
            <Field label="Table" value={`public.${TABLE}`} />
            <Field
              label="Status"
              value={
                connection.state === "checking" ? (
                  "Checking…"
                ) : connection.state === "ok" ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    Connected · {connection.rows} row{connection.rows === 1 ? "" : "s"} visible to you
                  </span>
                ) : (
                  <span className="text-rose-600 dark:text-rose-400">{connection.message}</span>
                )
              }
            />
          </div>
        </Section>

        <Section title="Automation" description="AI features planned for later phases.">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Automated job searching, AI qualification, cover letter drafting and application sending are{" "}
            <span className="font-semibold">disabled</span> in this version. Everything is tracked manually.
          </p>
        </Section>
      </div>
    </>
  );
}
