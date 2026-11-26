import type { AuthState } from "./auth-state";

export function AuthStatus({ state }: { state: AuthState }) {
  if (state.status === "idle") return null;

  return (
    <p
      className={state.status === "error" ? "notice form-error" : "notice"}
      role={state.status === "error" ? "alert" : "status"}
    >
      {state.message}
    </p>
  );
}
