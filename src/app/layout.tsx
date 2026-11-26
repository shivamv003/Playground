import type { Metadata } from "next";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Playground — Great ideas deserve the right people",
    template: "%s | Playground",
  },
  description:
    "Discover real-world problems and meet the people who want to solve them with you.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
