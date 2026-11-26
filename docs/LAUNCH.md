# Playground launch

## Deploy in order

1. Create a hosted Supabase project for staging. Apply every migration under `supabase/migrations` in filename order with `supabase db push` from a checkout linked to that staging project. Review the target project and the pending versions first with `supabase db push --dry-run`.
2. Configure the staging Vercel project with the Supabase project URL, public publishable key, and the staging HTTPS app origin as `NEXT_PUBLIC_APP_URL`. Copy the email templates and configure SMTP as described in the README.
3. Deploy the branch to staging and follow the smoke checks below. Run the database and browser suites locally against a separate Supabase stack. The browser suite creates test users and posts.
4. Apply the migrations to the production Supabase project before deploying this release to production. Use the production project URL, publishable key, and canonical HTTPS site URL in Vercel and Supabase Auth.
5. Check that `GET /health` returns HTTP 200 with `{"status":"ready"}` on the deployed site. A fresh database starts with an empty feed. Invite an initial group to publish real opportunities from their own accounts.

## Google sign-in

1. Create a Google OAuth client of type **Web application**, and configure its OAuth consent screen for your audience.
2. Add the callback URL shown in **Supabase → Authentication → Sign In / Providers → Google** as an authorized redirect URI in Google Cloud. It usually ends in `/auth/v1/callback` on your Supabase project.
3. Enable Google in Supabase and enter the Google client ID and secret there. Add your app’s `/auth/callback` URL to Supabase Auth’s redirect allowlist and set its Site URL to your canonical HTTPS origin. The app supplies the original destination as a `next` query parameter.
4. Set `PLAYGROUND_GOOGLE_SIGN_IN=true` in Vercel and redeploy. From a signed-out browser, start on a live problem, select **Log in to connect → Continue with Google**, and verify that a new user creates a profile and returns to the same problem.

## Production smoke checks

- Open Home and Explore as a guest, filter by category, and open a public post by its URL.
- Verify email signup and password reset with a real external inbox and the correct production URLs.
- Publish a problem with one account. With a second account, search for the post and request to connect. Accept it in Activity, then share and revoke one contact field. With a third account, verify that the request and contact field are inaccessible.
- Close requests and archive the post as its author. Verify guests can still read a closed post and can no longer open an archived one.
- Check a moderator can open a test report and remove its test post. Verify the action stays recorded and the public link no longer resolves.

## Moderation and support

Moderators need an existing Auth account and a completed profile. A database administrator can assign access in the correct Supabase project using the user's UUID.

```sql
insert into playground_private.moderators (user_id)
values ('<moderator-auth-user-uuid>')
on conflict do nothing;
```

The account sees **Moderation** on its profile. The queue supports dismissing reports, marking them reviewed, and removing reported posts. For verified profile abuse, use the Supabase Auth user controls and record the review in Playground. Moderator privileges do not expose private requests or contact shares.

Configure an uptime alert on `/health` and review Vercel runtime errors. The application logs a route template and error digest for unhandled server errors. Preserve redaction for cookies, authentication tokens, private messages, and shared contact values in any external integration.

Enable the appropriate Supabase backup policy for production and practice recovery into a separate project. Assign someone to review reports and respond to support requests. Publish the site’s privacy and community policies before opening registration publicly.
