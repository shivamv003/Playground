"use server";

import { redirect } from "next/navigation";
import type { AuthState } from "@/features/auth/auth-state";
import { safeReturnPath, withReturnPath } from "@/features/auth/return-path";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { saveOwnProfile } from "./profile-data";
import { profileSchema } from "./profile-validation";

export async function saveProfile(
  _previous: AuthState,
  form: FormData,
): Promise<AuthState> {
  const next = safeReturnPath(form.get("next"));
  const supabase = await createServerSupabaseClient();
  if (!supabase)
    return {
      status: "error",
      message: "Profiles are unavailable in this environment.",
    };

  const { data } = await supabase.auth.getClaims();
  if (!data?.claims.sub) redirect(withReturnPath("/login", next));

  const input = profileSchema.safeParse(Object.fromEntries(form));
  if (!input.success)
    return { status: "error", message: input.error.issues[0].message };

  const { error } = await saveOwnProfile(supabase, data.claims.sub, input.data);
  if (error?.code === "23505") {
    return {
      status: "error",
      message: "That username is already taken. Choose another one.",
    };
  }
  if (error)
    return {
      status: "error",
      message: "We couldn’t save your profile. Try again in a minute.",
    };

  redirect(next);
}
