import Link from "next/link";
import { readSupabaseConfig } from "@/lib/supabase/config";
import { AccountForm } from "./account-form";
import { AccountPanel } from "./account-panel";
import { isEmailToken } from "./auth-validation";
import { safeReturnPath, withReturnPath } from "./return-path";

export type EmailLinkQuery = Promise<{
  next?: string | string[];
  token_hash?: string | string[];
}>;

export async function EmailLinkScreen({
  mode,
  searchParams,
}: {
  mode: "confirm" | "reset";
  searchParams: EmailLinkQuery;
}) {
  const params = await searchParams;
  const next = safeReturnPath(params.next);
  const isConfirmation = mode === "confirm";
  const token = params.token_hash;
  const enabled = Boolean(readSupabaseConfig());

  return (
    <AccountPanel
      title={isConfirmation ? "Confirm your email" : "Choose a new password"}
      description={
        isConfirmation
          ? "Confirm your address to finish creating your Playground account."
          : "Enter a new password for your Playground account."
      }
    >
      {enabled && isEmailToken(token) ? (
        <AccountForm mode={mode} token={token} next={next} enabled />
      ) : (
        <p className="notice form-error" role="alert">
          {enabled
            ? "This link is incomplete. Open the link from your email or start again."
            : "Accounts are unavailable in this environment."}
        </p>
      )}
      <div className="account-switch">
        <Link
          className="text-link"
          href={withReturnPath(
            isConfirmation ? "/login" : "/forgot-password",
            next,
          )}
        >
          {isConfirmation ? "Back to log in" : "Request another reset link"}
        </Link>
      </div>
    </AccountPanel>
  );
}
