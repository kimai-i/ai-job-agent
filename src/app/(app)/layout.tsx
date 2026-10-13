import { Suspense } from "react";
import { Sidebar } from "@/components/sidebar";
import { AuthGate } from "./auth-gate";

function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-label="Loading">
      <div className="h-8 w-56 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-28 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        ))}
      </div>
      <div className="h-72 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full">
      <Sidebar />
      <main className="lg:pl-64">
        <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Suspense fallback={<PageSkeleton />}>
            <AuthGate>{children}</AuthGate>
          </Suspense>
        </div>
      </main>
    </div>
  );
}
