# Playground

**Great ideas deserve the right people.**

Playground helps students, developers, designers, and independent builders discover real-world problems and find teammates with complementary skills.

## Run locally

Use Node.js 22 or newer and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Guest browsing, search, category filtering, sample problem details, and the problem draft preview run without an account or a database. The preview lives in the current page and is discarded on navigation.

With Supabase configured, people can create and verify an email account, log in, reset their password, and publish an editable profile. Guest discovery still uses sample data. Live problem publishing, connection requests, activity, and contact exchange are later milestones.

## Checks

```sh
npm run lint
npm run typecheck
npm run build
npx playwright install chromium
npm test
```

Playwright starts the production build on port 3100. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to use a compatible system Chromium instead of downloading one. On Linux, `npx playwright install --with-deps chromium` can also install the browser's system dependencies.

## Supabase development

1. Install the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) and start Docker. Run `supabase start` from the repo root to apply both migrations and launch the local email inbox. If the stack already exists, restart it to pick up template changes and run `supabase migration up` for pending migrations.
2. Copy `.env.example` to `.env.local`. Set the URL and publishable key from `supabase status`. Older local CLIs may show the public `anon` key instead. Keep privileged keys out of browser variables and Git.
3. Use the same app origin for `NEXT_PUBLIC_APP_URL` and the address you open in your browser. The default is `http://localhost:3000`. Restart Next.js when changing configuration.
4. Open the Mailpit URL shown by `supabase status` to complete confirmation and password reset in development.

Run the PostgreSQL permission checks against your local Supabase database using the connection string from `supabase status` as `DATABASE_URL`.

```sh
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/integration/categories.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/integration/profiles.sql
```

Run the account browser suite against the local Supabase stack and Mailpit. Use a dedicated local test database because the suite creates an account and profile.

```sh
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3100 npm run build
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3100 PLAYWRIGHT_MAILPIT_URL=http://127.0.0.1:54324 npm test
```

Without `PLAYWRIGHT_MAILPIT_URL`, Playwright runs the guest and return-path checks and skips the live account journey.

## Hosted Supabase and Vercel

1. Apply both migrations to your Supabase project and enable email confirmation. Set the minimum password length to at least 8.
2. In Supabase Auth, set the Site URL to your HTTPS app origin. Allow the app's `/auth/confirm`, `/reset-password`, and `/auth/callback` paths, including the `next` query string. Add each preview origin explicitly if it needs working auth.
3. Copy [confirmation.html](supabase/templates/confirmation.html) and [recovery.html](supabase/templates/recovery.html) into the corresponding Supabase email templates. The app supplies the destination through `RedirectTo` and verifies the one-time `TokenHash`. Configure your email provider for production delivery.
4. Set the three public variables from `.env.example` in the Vercel environment and rebuild. Use the app's HTTPS origin for `NEXT_PUBLIC_APP_URL`.
5. For optional Google sign-in, enable the Google provider in Supabase and configure Google's authorized redirect URI as the Supabase callback URL shown in the provider settings. Set `PLAYGROUND_GOOGLE_SIGN_IN=true` in Vercel after the provider is ready.

Profiles are public by design. The email used to sign up stays in Supabase Auth and is excluded from all public profile queries.

## Project notes

- [Product vision](docs/PRODUCT_VISION.md)
- [MVP scope](docs/MVP_SCOPE.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Database schema](docs/DATABASE_SCHEMA.md)
- [Design system](docs/DESIGN_SYSTEM.md)
- [Development roadmap](docs/DEVELOPMENT_ROADMAP.md)
- [Decisions](docs/DECISIONS.md)
- [Contributor and agent guidance](AGENTS.md)
