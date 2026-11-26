import type { AuthState } from "@/features/auth/auth-state";

export function mutationStatus(
  error: { code: string; message: string } | null,
  success: string,
  failure: string,
): AuthState {
  if (!error) return { status: "success", message: success };
  // These codes are raised by Playground functions with fixed, user-facing messages.
  if (["PT400", "PT403", "PT409", "PT429"].includes(error.code)) {
    return { status: "error", message: error.message };
  }
  return { status: "error", message: failure };
}
