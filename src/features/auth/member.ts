import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { withReturnPath } from "./return-path";

export async function requireMember(next: string, readOnly = false) {
  const supabase = await createServerSupabaseClient({ readOnly });
  const claims = supabase ? await supabase.auth.getClaims() : null;
  const userId = claims?.data?.claims.sub;
  if (!supabase || !userId) redirect(withReturnPath("/login", next));

  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error("Could not load your profile.");
  if (!data) redirect(withReturnPath("/onboarding", next));
  return { supabase, userId };
}
