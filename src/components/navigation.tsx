"use client";

import {
  ArrowUpRight,
  Bell,
  Compass,
  House,
  Plus,
  Search,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { withReturnPath } from "@/features/auth/return-path";
import { Brand } from "./brand";

const primaryLinks = [
  { label: "Home", href: "/", icon: House },
  { label: "Explore", href: "/explore", icon: Compass },
  { label: "Create", href: "/create", icon: Plus },
  { label: "Activity", href: "/activity", icon: Bell },
];

const mobileLinks = [
  ...primaryLinks,
  { label: "Me", href: "/profile", icon: UserRound },
];

export function Navigation({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();

  return (
    <>
      <header className="site-header">
        <div className="site-container header-inner">
          <Brand />
          <nav className="desktop-nav" aria-label="Main navigation">
            {primaryLinks.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname === href ? "page" : undefined}
              >
                <Icon size={17} aria-hidden="true" /> {label}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            {signedIn ? (
              <Link
                href="/profile"
                className="button button-small button-dark"
                aria-current={pathname === "/profile" ? "page" : undefined}
              >
                <UserRound size={17} aria-hidden="true" /> Your profile
              </Link>
            ) : (
              <>
                <Link
                  href={withReturnPath("/login", pathname)}
                  className="login-link"
                >
                  Log in
                </Link>
                <Link
                  href="/profile"
                  className="icon-link"
                  aria-label="Profile"
                  aria-current={pathname === "/profile" ? "page" : undefined}
                >
                  <UserRound size={19} />
                </Link>
                <Link
                  href={withReturnPath("/signup", pathname)}
                  className="button button-small button-dark"
                >
                  Join Playground <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </>
            )}
          </div>
          <Link
            href="/explore#search"
            className="icon-link mobile-search"
            aria-label="Search problems"
          >
            <Search size={22} />
          </Link>
        </div>
      </header>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {mobileLinks.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={pathname === href ? "page" : undefined}
          >
            <Icon size={21} aria-hidden="true" />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
