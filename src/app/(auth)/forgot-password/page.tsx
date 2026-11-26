import Link from "next/link";
import { AccountForm } from "@/features/auth/account-form";
import { AccountPanel } from "@/features/auth/account-panel";
import { safeReturnPath, withReturnPath } from "@/features/auth/return-path";
import { readSupabaseConfig } from "@/lib/supabase/config";

export const metadata = { title: "Forgot password" };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const next = safeReturnPath((await searchParams).next);
  const enabled = Boolean(readSupabaseConfig());

  return (
    <AccountPanel
      title="Reset your password"
      description="Enter the email you used to sign up."
    >
      {!enabled && (
        <p className="notice">
          Password reset is unavailable in this environment.
        </p>
      )}
      <AccountForm mode="forgot" next={next} enabled={enabled} />
      <div className="account-switch">
        <Link className="text-link" href={withReturnPath("/login", next)}>
          Back to log in
        </Link>
      </div>
    </AccountPanel>
  );
}
