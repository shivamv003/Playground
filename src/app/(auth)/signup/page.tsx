import {
  AccountScreen,
  type AccountQuery,
} from "@/features/auth/account-screen";

export const metadata = { title: "Join Playground" };

export default function SignupPage({
  searchParams,
}: {
  searchParams: AccountQuery;
}) {
  return <AccountScreen mode="signup" searchParams={searchParams} />;
}
