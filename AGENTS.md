# Working in Playground

Playground helps people discover problems, make introductions, and form teams. Keep the product focused on discovery, mutual acceptance, and voluntary contact exchange. Project execution, task management, team chat, and collaboration workspaces are outside scope.

- Work in the existing checkout and preserve unrelated changes.
- Use strict TypeScript and descriptive names. Group feature code under `src/features` and keep route files focused on composing screens.
- Prefer Server Components. Add a Client Component when it needs browser state or browser events.
- Keep Supabase access in server actions, route handlers, or data modules. Validate mutations server-side and enforce permissions in PostgreSQL.
- Add migrations for schema changes. Enable row-level security on exposed tables and test authorization using distinct user roles as the data model grows.
- Keep guest discovery public. Keep contacts private and require explicit, revocable sharing after acceptance.
- Clearly label sample data and unavailable actions. Never commit credentials or log private values.
- Run lint, type checking, and a production build before handing off. Run Playwright against the build for changes to user journeys.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
