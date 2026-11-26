import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { readSupabaseConfig } from "./config";
import { sessionCookieOptions } from "./session-cookie";

export async function createServerSupabaseClient({ readOnly = false } = {}) {
  const config = readSupabaseConfig();
  if (!config) return null;

  const cookieStore = await cookies();
  return createServerClient(config.url, config.publishableKey, {
    cookieOptions: sessionCookieOptions(config.secureCookies),
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (updates) => {
        // Proxy refreshes the session before Server Components read it.
        if (readOnly) return;
        for (const { name, value, options } of updates) {
          cookieStore.set(name, value, options);
        }
      },
    },
  });
}

export type PlaygroundSupabaseClient = NonNullable<
  Awaited<ReturnType<typeof createServerSupabaseClient>>
>;
