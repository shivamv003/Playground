export function readSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!url || !publishableKey || !appUrl) return null;

  try {
    const app = new URL(appUrl);
    const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(app.hostname);
    if (app.protocol !== "https:" && !(app.protocol === "http:" && loopback)) {
      return null;
    }
    return {
      url,
      publishableKey,
      origin: app.origin,
      secureCookies: app.protocol === "https:",
    };
  } catch {
    return null;
  }
}
