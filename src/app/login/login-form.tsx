"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { btn, card, input, label } from "@/components/ui";
import { PasswordInput } from "@/components/password-input";

const NOTICES: Record<string, { tone: "ok" | "warn"; text: string }> = {
  confirmed: { tone: "ok", text: "Your email is confirmed. You can sign in now." },
  "confirm-failed": {
    tone: "warn",
    text: "That confirmation link is invalid or has expired. Request a new one below by trying to sign in.",
  },
  "password-updated": { tone: "ok", text: "Your password has been updated. Sign in with your new password." },
};

function ForgotPasswordForm({ initialEmail, onBack }: { initialEmail: string; onBack: () => void }) {
  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function sendReset(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <form onSubmit={sendReset} className={`${card} space-y-4 p-6`}>
      <div>
        <h2 className="text-base font-semibold">Reset your password</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Enter your account email and we&rsquo;ll send you a link to set a new password.
        </p>
      </div>
      {sent ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
          If an account exists for {email.trim()}, a reset link is on its way. Open it in this same browser.
        </p>
      ) : (
        <>
          <div>
            <label htmlFor="reset-email" className={label}>
              Email
            </label>
            <input
              id="reset-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={input}
            />
          </div>
          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </p>
          )}
          <button type="submit" className={`${btn.primary} w-full`} disabled={busy}>
            {busy ? "Sending…" : "Send reset link"}
          </button>
        </>
      )}
      <button
        type="button"
        onClick={onBack}
        className="w-full text-center text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
      >
        Back to sign in
      </button>
    </form>
  );
}

/** The last email that signed in on this browser, so the form is pre-filled next time. */
const LAST_EMAIL_KEY = "ai-job-agent:last-email";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "forgot">("signin");
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
    try {
      const saved = window.localStorage.getItem(LAST_EMAIL_KEY);
      if (saved) setEmail(saved);
    } catch {
      // Storage can be blocked (private window); the field just starts empty.
    }
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
    try {
      window.localStorage.setItem(LAST_EMAIL_KEY, email.trim());
    } catch {
      // Not remembering the email is harmless.
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

  if (mode === "forgot") {
    return <ForgotPasswordForm initialEmail={email} onBack={() => setMode("signin")} />;
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
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Password
          </label>
          <button
            type="button"
            onClick={() => setMode("forgot")}
            className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Forgot password?
          </button>
        </div>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
