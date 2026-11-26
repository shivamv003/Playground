import Link from "next/link";
import { Brand } from "@/components/brand";
import { Navigation } from "@/components/navigation";
import { getViewerId } from "@/features/auth/viewer";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const viewerId = await getViewerId();

  return (
    <>
      <Navigation signedIn={Boolean(viewerId)} />
      <main id="main-content" className="site-container main-content">
        {children}
      </main>
      <footer className="site-container site-footer">
        <Brand />
        <div className="footer-links">
          <Link href="/explore">Explore</Link>
          <Link href="/create">Post a problem</Link>
          <Link href="/profile">Profile</Link>
        </div>
        <p>Great ideas deserve the right people.</p>
      </footer>
    </>
  );
}
