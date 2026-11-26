import Link from "next/link";
import { redirect } from "next/navigation";
import { readSupabaseConfig } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AccountForm, GoogleSignIn } from "./account-form";
import { AccountPanel } from "./account-panel";
import { postAuthDestination } from "./destination";
import { safeReturnPath, withReturnPath } from "./return-path";
import { getViewerId } from "./viewer";

export type AccountQuery = Promise<{
  next?: string | string[];
  reset?: string | string[];
  callback?: string | string[];
}>;

export async function AccountScreen({
  mode,
  searchParams,
}: {
  mode: "signup" | "login";
  searchParams: AccountQuery;
}) {
  const params = await searchParams;
  const next = safeReturnPath(params.next);
  const enabled = Boolean(readSupabaseConfig());
  const viewerId = await getViewerId();
  if (viewerId) {
    const supabase = await createServerSupabaseClient({ readOnly: true });
    if (supabase) redirect(await postAuthDestination(supabase, viewerId, next));
  }

  const isSignup = mode === "signup";
  return (
    <AccountPanel
      title={isSignup ? "Join Playground" : "Welcome back"}
      description={
        isSignup
          ? "Find people to build something that matters with."
          : "Log in to your Playground account."
      }
    >
      {!enabled && (
        <p className="notice">
          Accounts are unavailable in this environment. You can still explore as
          a guest.
        </p>
      )}
      {params.reset === "1" && (
        <p className="notice" role="status">
          Password updated. Log in with your new password.
        </p>
      )}
      {params.callback === "failed" && (
        <p className="notice form-error" role="alert">
          We couldn’t finish Google sign-in. Try again or log in with email.
        </p>
      )}
      <AccountForm mode={mode} next={next} enabled={enabled} />
      {enabled && process.env.PLAYGROUND_GOOGLE_SIGN_IN === "true" && (
        <GoogleSignIn next={next} />
      )}
      <div className="account-switch">
        {isSignup ? "Already have an account?" : "New to Playground?"}{" "}
        <Link
          className="text-link"
          href={withReturnPath(isSignup ? "/login" : "/signup", next)}
        >
          {isSignup ? "Log in" : "Join Playground"}
        </Link>
      </div>
    </AccountPanel>
  );
}
