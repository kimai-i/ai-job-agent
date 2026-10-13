import type { Metadata } from "next";
import { SparklesIcon } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { btn } from "@/components/ui";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Set a new password" };

export default function ResetPasswordPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <ThemeToggle className={`${btn.icon} absolute top-4 right-4`} />
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex size-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <SparklesIcon className="size-5" />
          </div>
          <h1 className="mt-4 text-xl font-semibold tracking-tight">Set a new password</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">AI Job Application Agent</p>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
