# Decisions

- **App Router and Supabase.** Web routes, Server Components, and Supabase's shared API leave space for a future mobile client without introducing a second backend.
- **Local sample content.** The initial guest experience runs without credentials. Samples are labeled and live persistence remains explicit.
- **Shared CSS tokens and Tailwind.** Layout and recurring visual treatments reuse a compact stylesheet. Dedicated UI-library components can be introduced when they solve an interaction or accessibility need.
- **Production-mode browser checks.** Playwright covers guest discovery, search, navigation, and preview forms against the compiled app so route and build issues surface together.

- **Server-owned sessions.** Route handlers, the proxy, and Server Actions manage Supabase sessions through HttpOnly cookies. React uses verified viewer state without reading tokens.
- **Public profile boundary.** The profile has public display fields. Account email stays in Auth, and future contact sharing will use separate, authorized records.
