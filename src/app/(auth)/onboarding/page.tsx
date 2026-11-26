import { redirect } from "next/navigation";
import { AccountPanel } from "@/features/auth/account-panel";
import { safeReturnPath, withReturnPath } from "@/features/auth/return-path";
import { getViewerId } from "@/features/auth/viewer";
import { findOwnProfile } from "@/features/profiles/profile-data";
import { ProfileForm } from "@/features/profiles/profile-form";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Set up your profile",
  robots: { index: false },
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const next = safeReturnPath((await searchParams).next);
  const userId = await getViewerId();
  const supabase = await createServerSupabaseClient({ readOnly: true });
  if (!supabase || !userId) redirect(withReturnPath("/login", next));

  const { data, error } = await findOwnProfile(supabase, userId);
  if (data) redirect(next);

  return (
    <AccountPanel
      title="Set up your profile"
      description="Choose how you’ll appear to other builders. Everything on this form is public."
    >
      {error ? (
        <p className="notice form-error" role="alert">
          We couldn’t load your profile. Refresh the page to try again.
        </p>
      ) : (
        <ProfileForm next={next} />
      )}
    </AccountPanel>
  );
}
