import { cache } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const getViewerId = cache(async () => {
  const supabase = await createServerSupabaseClient({ readOnly: true });
  if (!supabase) return null;

  const { data } = await supabase.auth.getClaims();
  return data?.claims.sub ?? null;
});
