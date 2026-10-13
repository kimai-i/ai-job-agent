import type { Metadata } from "next";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SparklesIcon } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { btn } from "@/components/ui";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <ThemeToggle className={`${btn.icon} absolute top-4 right-4`} />
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex size-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <SparklesIcon className="size-5" />
          </div>
          <h1 className="mt-4 text-xl font-semibold tracking-tight">AI Job Application Agent</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Sign in to manage your applications</p>
        </div>

        {isSupabaseConfigured ? (
          <LoginForm />
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            <p className="font-semibold">Supabase is not configured yet</p>
            <p className="mt-1">
              Create <code className="font-mono">.env.local</code> from <code className="font-mono">.env.example</code>{" "}
              with your project URL and publishable key, then restart the dev server.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
