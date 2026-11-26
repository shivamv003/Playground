import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { readSupabaseConfig } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = readSupabaseConfig();
  const ready =
    config && (await checkDatabase(config.url, config.publishableKey));

  return NextResponse.json(
    { status: ready ? "ready" : "unavailable" },
    {
      status: ready ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

async function checkDatabase(url: string, key: string) {
  try {
    const supabase = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
    const { error } = await supabase
      .from("problems")
      .select("id", { head: true })
      .in("status", ["open", "closed"])
      .limit(1)
      .abortSignal(AbortSignal.timeout(4500));
    return !error;
  } catch {
    return false;
  }
}
