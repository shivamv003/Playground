import { notFound } from "next/navigation";
import { findPublicProfile } from "@/features/profiles/profile-data";
import { ProfileSummary } from "@/features/profiles/profile-summary";
import { usernamePattern } from "@/features/profiles/profile-validation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = { title: "Playground profile" };

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createServerSupabaseClient({ readOnly: true });
  if (!supabase || !usernamePattern.test(username)) notFound();

  const { data, error } = await findPublicProfile(supabase, username);
  if (error) {
    return (
      <p className="notice form-error" role="alert">
        We couldn’t load this profile. Refresh the page to try again.
      </p>
    );
  }
  if (!data) notFound();

  return (
    <article className="panel profile-overview">
      <ProfileSummary profile={data} />
    </article>
  );
}
