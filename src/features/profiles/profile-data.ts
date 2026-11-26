import type { PlaygroundSupabaseClient } from "@/lib/supabase/server";
import type { ProfileContent } from "./profile-validation";

const profileFields =
  "username, display_name, headline, bio, skills, interests";

export function findOwnProfile(
  supabase: PlaygroundSupabaseClient,
  userId: string,
) {
  return supabase
    .from("profiles")
    .select(profileFields)
    .eq("id", userId)
    .maybeSingle()
    .overrideTypes<ProfileContent, { merge: false }>();
}

export function findPublicProfile(
  supabase: PlaygroundSupabaseClient,
  username: string,
) {
  return supabase
    .from("profiles")
    .select(profileFields)
    .eq("username", username)
    .maybeSingle()
    .overrideTypes<ProfileContent, { merge: false }>();
}

export function saveOwnProfile(
  supabase: PlaygroundSupabaseClient,
  userId: string,
  profile: ProfileContent,
) {
  return supabase
    .from("profiles")
    .upsert({ id: userId, ...profile }, { onConflict: "id" });
}
