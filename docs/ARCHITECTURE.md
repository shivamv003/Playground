# Architecture

Next.js App Router owns page rendering and routing. Main and account route groups provide separate shared layouts. Pages are Server Components by default. The navigation and draft form use client-side state for active routes and form previews.

Reusable visual primitives and the shell live in `src/components`. Sample problems, filtering inputs, cards, and draft validation live under `src/features/discovery`. Account forms and actions live under `src/features/auth`. Profile forms, persistence, and validation live under `src/features/profiles`. The server-only Supabase client uses HttpOnly cookies. The Next.js proxy refreshes sessions and passes updated cookies to Server Components. Authenticated pages are rendered per request.

Confirmation and recovery email links open forms. They consume their one-time tokens only when the user submits the form. OAuth uses a code exchange with PKCE. Auth return paths are restricted to known application pages. PostgreSQL ties every profile write to the verified viewer ID, and public profile queries select only display fields.

When live data is introduced, server mutations should validate inputs before calling the data layer. PostgreSQL constraints and row-level security enforce ownership and privacy even if requests bypass the interface. Multi-row transitions, such as accepting a request and creating a connection, belong in transactions.
