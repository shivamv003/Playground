import {
  EmailLinkScreen,
  type EmailLinkQuery,
} from "@/features/auth/email-link-screen";

export const metadata = {
  title: "Choose a new password",
  referrer: "no-referrer",
  robots: { index: false },
};

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: EmailLinkQuery;
}) {
  return <EmailLinkScreen mode="reset" searchParams={searchParams} />;
}
