import { redirect } from "next/navigation";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Server-side check that runs in addition to the proxy: page content only
 * renders once a valid Supabase session is confirmed.
 */
export async function AuthGate({ children }: { children: ReactNode }) {
  // Session checks compare token expiry with the current time, so this must
  // run at request time rather than during prerendering.
  await connection();
  if (!isSupabaseConfigured) redirect("/login");
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");
  return <>{children}</>;
}
