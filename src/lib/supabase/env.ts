// Public Supabase config. Only the URL and the *publishable* key are ever used
// by this app; secret / service-role keys must never be referenced here.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY,
);

export function supabaseHost(): string {
  try {
    return new URL(SUPABASE_URL).host;
  } catch {
    return "";
  }
}
