import { NextResponse, type NextRequest } from "next/server";
import { postAuthDestination } from "@/features/auth/destination";
import { withReturnPath } from "@/features/auth/return-path";
import { readSupabaseConfig } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const config = readSupabaseConfig();
  if (!config) {
    return new Response("Accounts are unavailable in this environment.", {
      status: 503,
    });
  }
  const next = request.nextUrl.searchParams.get("next");
  const code = request.nextUrl.searchParams.get("code");
  const supabase = await createServerSupabaseClient();
  let destination = withReturnPath("/login", next) + "&callback=failed";

  if (supabase && code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user && data.session) {
      destination = await postAuthDestination(supabase, data.user.id, next);
    }
  }

  const response = NextResponse.redirect(new URL(destination, config.origin));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
