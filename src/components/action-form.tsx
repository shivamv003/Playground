"use client";

import { useActionState } from "react";
import { type AuthState, idleAuthState } from "@/features/auth/auth-state";
import { AuthStatus } from "@/features/auth/auth-status";

export type Action = (state: AuthState, form: FormData) => Promise<AuthState>;

export function ActionForm({
  action,
  children,
  label,
  primary = false,
  className = "form-stack",
}: {
  action: Action;
  children?: React.ReactNode;
  label: string;
  primary?: boolean;
  className?: string;
}) {
  const [state, submit, pending] = useActionState(action, idleAuthState);

  return (
    <form action={submit} className={className}>
      <fieldset disabled={pending} className="form-stack">
        {children}
        <button
          type="submit"
          className={`button ${primary ? "button-primary" : "button-outline"}`}
        >
          {pending ? "Please wait…" : label}
        </button>
      </fieldset>
      <AuthStatus state={state} />
    </form>
  );
}
