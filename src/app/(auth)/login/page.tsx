import {
  AccountScreen,
  type AccountQuery,
} from "@/features/auth/account-screen";

export const metadata = { title: "Log in" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: AccountQuery;
}) {
  return <AccountScreen mode="login" searchParams={searchParams} />;
}
