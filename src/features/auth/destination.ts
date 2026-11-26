import type { PlaygroundSupabaseClient } from "@/lib/supabase/server";
import { findOwnProfile } from "@/features/profiles/profile-data";
import { safeReturnPath, withReturnPath } from "./return-path";

export async function postAuthDestination(
  supabase: PlaygroundSupabaseClient,
  userId: string,
  next: unknown,
) {
  const { data } = await findOwnProfile(supabase, userId);
  return data ? safeReturnPath(next) : withReturnPath("/onboarding", next);
}
