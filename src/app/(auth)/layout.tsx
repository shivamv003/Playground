import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Brand } from "@/components/brand";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="site-header">
        <div className="site-container header-inner auth-header">
          <Brand />
          <Link href="/explore" className="text-link">
            <ArrowLeft size={17} aria-hidden="true" /> Explore as a guest
          </Link>
        </div>
      </header>
      <main id="main-content" className="site-container auth-main">
        {children}
      </main>
    </>
  );
}
