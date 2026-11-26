export const sessionCookieName = "pg-session";

export function sessionCookieOptions(secure: boolean) {
  return {
    name: sessionCookieName,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure,
  } as const;
}
