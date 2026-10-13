import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles links from Supabase auth emails (signup confirmation).
 * Supports both the PKCE `code` flow and the `token_hash` flow.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const redirect = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    return url;
  };

  const supabase = await createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(redirect("/dashboard"));
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(redirect("/dashboard"));
    // The email is already verified by Supabase before redirecting here; the
    // code exchange can fail if the link is opened in a different browser.
    const login = redirect("/login");
    login.searchParams.set("notice", "confirmed");
    return NextResponse.redirect(login);
  }

  const login = redirect("/login");
  login.searchParams.set("notice", "confirm-failed");
  return NextResponse.redirect(login);
}
