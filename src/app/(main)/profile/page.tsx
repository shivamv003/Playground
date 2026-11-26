import { UserRound } from "lucide-react";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { logOut } from "@/features/auth/actions";
import { withReturnPath } from "@/features/auth/return-path";
import { getViewerId } from "@/features/auth/viewer";
import { findOwnProfile } from "@/features/profiles/profile-data";
import { ProfileSummary } from "@/features/profiles/profile-summary";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = { title: "Profile", robots: { index: false } };

export default async function ProfilePage() {
  const userId = await getViewerId();
  const supabase = await createServerSupabaseClient({ readOnly: true });

  if (!userId || !supabase) {
    return (
      <>
        <PageIntro
          title="Your profile"
          description="Tell future teammates what you care about and what you can help build."
        />
        <section className="empty-state">
          <div className="state-icon tone-lilac">
            <UserRound size={26} aria-hidden="true" />
          </div>
          <h2>
            {supabase
              ? "Make it easier for teammates to find you"
              : "Accounts are unavailable in this environment"}
          </h2>
          {supabase ? (
            <div className="account-links">
              <Link
                href={withReturnPath("/signup", "/profile")}
                className="button button-primary"
              >
                Join Playground
              </Link>
              <Link
                href={withReturnPath("/login", "/profile")}
                className="button button-outline"
              >
                Log in
              </Link>
            </div>
          ) : (
            <Link href="/explore" className="button button-outline">
              Explore as a guest
            </Link>
          )}
        </section>
      </>
    );
  }

  const { data: profile, error } = await findOwnProfile(supabase, userId);
  return (
    <section
      className="panel profile-overview"
      aria-label="Your Playground account"
    >
      {profile ? (
        <>
          <ProfileSummary profile={profile} />
          <div className="profile-actions">
            <Link className="button button-primary" href="/profile/edit">
              Edit profile
            </Link>
            <Link
              className="button button-outline"
              href={`/people/${profile.username}`}
            >
              View public profile
            </Link>
          </div>
        </>
      ) : (
        <>
          <PageIntro
            title="Your profile"
            description={
              error
                ? "We couldn’t load your profile. Refresh the page to try again."
                : "Add a display name and username to get started."
            }
          />
          {!error && (
            <Link
              className="button button-primary"
              href={withReturnPath("/onboarding", "/profile")}
            >
              Set up your profile
            </Link>
          )}
        </>
      )}
      <form action={logOut} className="profile-signout">
        <button className="button button-outline" type="submit">
          Log out
        </button>
      </form>
    </section>
  );
}
