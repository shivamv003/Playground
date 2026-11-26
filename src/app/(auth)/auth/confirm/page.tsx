import {
  EmailLinkScreen,
  type EmailLinkQuery,
} from "@/features/auth/email-link-screen";

export const metadata = {
  title: "Confirm email",
  referrer: "no-referrer",
  robots: { index: false },
};

export default function ConfirmPage({
  searchParams,
}: {
  searchParams: EmailLinkQuery;
}) {
  return <EmailLinkScreen mode="confirm" searchParams={searchParams} />;
}
