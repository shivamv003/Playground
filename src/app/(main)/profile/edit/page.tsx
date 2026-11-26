import Link from "next/link";
import { redirect } from "next/navigation";
import { PageIntro } from "@/components/page-intro";
import { withReturnPath } from "@/features/auth/return-path";
import { getViewerId } from "@/features/auth/viewer";
import { findOwnProfile } from "@/features/profiles/profile-data";
import { ProfileForm } from "@/features/profiles/profile-form";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Edit your profile",
  robots: { index: false },
};

export default async function EditProfilePage() {
  const userId = await getViewerId();
  const supabase = await createServerSupabaseClient({ readOnly: true });
  if (!supabase || !userId) redirect(withReturnPath("/login", "/profile/edit"));

  const { data, error } = await findOwnProfile(supabase, userId);
  if (!error && !data) redirect(withReturnPath("/onboarding", "/profile"));

  return (
    <>
      <PageIntro
        title="Edit your profile"
        description="These details are visible on your public profile."
      />
      <section
        className="panel profile-editor"
        aria-label="Edit public profile"
      >
        {error || !data ? (
          <p className="notice form-error" role="alert">
            We couldn’t load your profile. Refresh the page to try again.
          </p>
        ) : (
          <ProfileForm profile={data} next="/profile" />
        )}
      </section>
      <Link className="text-link profile-back" href="/profile">
        Back to your profile
      </Link>
    </>
  );
}
