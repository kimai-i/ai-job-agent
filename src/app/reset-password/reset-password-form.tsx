"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { NewPasswordForm } from "@/components/new-password-form";
import { card } from "@/components/ui";

type State = { status: "checking" } | { status: "ready" } | { status: "invalid"; message: string };

/**
 * Landing page for the password-reset email. Supabase redirects here with a
 * one-time `code`, which is exchanged for a short-lived session so the user
 * can choose a new password.
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const [state, setState] = useState<State>({ status: "checking" });

  useEffect(() => {
    const supabase = createClient();
    const url = new URL(window.location.href);
    const linkError =
      url.searchParams.get("error_description") ??
      new URLSearchParams(url.hash.slice(1)).get("error_description");

    (async () => {
      if (linkError) {
        setState({ status: "invalid", message: linkError });
        return;
      }
      const code = url.searchParams.get("code");
      let exchangeError: string | null = null;
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) exchangeError = error.message;
        window.history.replaceState(null, "", url.pathname);
      }
      // The client may already have exchanged the code itself; trust the session.
      const { data } = await supabase.auth.getSession();
      if (data.session) setState({ status: "ready" });
      else
        setState({
          status: "invalid",
          message:
            exchangeError ??
            "This reset link is invalid or has expired. Request a new one and open it in the same browser.",
        });
    })();
  }, []);

  return (
    <div className={`${card} p-6`}>
      {state.status === "checking" && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Checking your reset link…</p>
      )}
      {state.status === "invalid" && (
        <div className="space-y-4">
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
            {state.message}
          </p>
          <Link href="/login" className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            Back to sign in
          </Link>
        </div>
      )}
      {state.status === "ready" && (
        <NewPasswordForm
          submitLabel="Save new password"
          onDone={() => {
            router.replace("/dashboard");
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
