import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { readSupabaseConfig } from "@/lib/supabase/config";
import {
  sessionCookieName,
  sessionCookieOptions,
} from "@/lib/supabase/session-cookie";

export async function proxy(request: NextRequest) {
  const config = readSupabaseConfig();
  const hasSession = request.cookies
    .getAll()
    .some(
      ({ name }) =>
        name === sessionCookieName || name.startsWith(`${sessionCookieName}.`),
    );

  if (!config || !hasSession) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.publishableKey, {
    cookieOptions: sessionCookieOptions(config.secureCookies),
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (updates, headers) => {
        for (const { name, value } of updates) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of updates) {
          response.cookies.set(name, value, options);
        }
        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  await supabase.auth.getClaims();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|images/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)",
  ],
};
