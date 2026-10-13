"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { btn, card, input, label } from "@/components/ui";

const NOTICES: Record<string, { tone: "ok" | "warn"; text: string }> = {
  confirmed: { tone: "ok", text: "Your email is confirmed. You can sign in now." },
  "confirm-failed": {
    tone: "warn",
    text: "That confirmation link is invalid or has expired. Request a new one below by trying to sign in.",
  },
};

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "warn"; text: string } | null>(null);

  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get("notice");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the URL on mount
    if (key && NOTICES[key]) setNotice(NOTICES[key]);
  }, []);

  async function signIn(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setUnconfirmed(false);
    setNotice(null);

    const { error } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      if (error.code === "email_not_confirmed") {
        setUnconfirmed(true);
        setError("Your email address hasn’t been confirmed yet.");
      } else if (error.code === "invalid_credentials") {
        setError("Incorrect email or password.");
      } else {
        setError(error.message);
      }
      setBusy(false);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  async function resendConfirmation() {
    setBusy(true);
    const { error } = await createClient().auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    });
    setBusy(false);
    if (error) {
      setError(error.message);
    } else {
      setUnconfirmed(false);
      setError(null);
      setNotice({ tone: "ok", text: `Confirmation email sent to ${email.trim()}. Open the link, then sign in.` });
    }
  }

  return (
    <form onSubmit={signIn} className={`${card} space-y-4 p-6`}>
      {notice && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            notice.tone === "ok"
              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300"
              : "bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200"
          }`}
        >
          {notice.text}
        </p>
      )}
      <div>
        <label htmlFor="email" className={label}>
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={input}
        />
      </div>
      <div>
        <label htmlFor="password" className={label}>
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={input}
        />
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
          <p>{error}</p>
          {unconfirmed && (
            <button
              type="button"
              onClick={resendConfirmation}
              disabled={busy}
              className="mt-1 font-medium underline underline-offset-2"
            >
              Resend confirmation email
            </button>
          )}
        </div>
      )}

      <button type="submit" className={`${btn.primary} w-full`} disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
