export type AuthState =
  { status: "idle" } | { status: "success" | "error"; message: string };

export const idleAuthState: AuthState = { status: "idle" };
