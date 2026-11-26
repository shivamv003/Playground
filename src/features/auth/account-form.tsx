"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  confirmEmail,
  logIn,
  requestPasswordReset,
  resetPassword,
  signUp,
  startGoogleSignIn,
} from "./actions";
import { idleAuthState } from "./auth-state";
import { AuthStatus } from "./auth-status";
import { withReturnPath } from "./return-path";

const forms = {
  signup: { action: signUp, label: "Create an account" },
  login: { action: logIn, label: "Log in" },
  forgot: { action: requestPasswordReset, label: "Send reset link" },
  reset: { action: resetPassword, label: "Update password" },
  confirm: { action: confirmEmail, label: "Confirm email" },
};

type AccountFormProps = {
  mode: keyof typeof forms;
  next: string;
  enabled: boolean;
  token?: string;
};

export function AccountForm({ mode, next, enabled, token }: AccountFormProps) {
  const { action, label } = forms[mode];
  const [state, submit, pending] = useActionState(action, idleAuthState);
  const hasEmail = mode === "login" || mode === "signup" || mode === "forgot";
  const hasPassword = mode === "login" || mode === "signup" || mode === "reset";
  const newPassword = mode === "signup" || mode === "reset";

  return (
    <form action={submit} className="form-stack">
      <AuthStatus state={state} />
      {state.status !== "success" && (
        <fieldset className="form-stack" disabled={!enabled || pending}>
          <input type="hidden" name="next" value={next} />
          {token && <input type="hidden" name="token_hash" value={token} />}
          {hasEmail && (
            <div className="form-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
              />
            </div>
          )}
          {hasPassword && (
            <div className="form-field">
              <label htmlFor="password">
                {mode === "reset" ? "New password" : "Password"}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={newPassword ? "new-password" : "current-password"}
                required
                minLength={newPassword ? 8 : undefined}
                maxLength={72}
                aria-describedby={newPassword ? "password-hint" : undefined}
              />
              {newPassword && (
                <span id="password-hint" className="field-hint">
                  At least 8 characters.
                </span>
              )}
            </div>
          )}
          {mode === "reset" && (
            <div className="form-field">
              <label htmlFor="confirmation">Confirm new password</label>
              <input
                id="confirmation"
                name="confirmation"
                type="password"
                autoComplete="new-password"
                required
                maxLength={72}
              />
            </div>
          )}
          {mode === "login" && (
            <Link
              className="text-link"
              href={withReturnPath("/forgot-password", next)}
            >
              Forgot your password?
            </Link>
          )}
          <button type="submit" className="button button-primary">
            {pending ? "Please wait…" : label}
          </button>
        </fieldset>
      )}
      {mode === "login" && (
        <Link href="/explore" className="button button-outline">
          Enter as a guest
        </Link>
      )}
    </form>
  );
}

export function GoogleSignIn({ next }: { next: string }) {
  const [state, submit, pending] = useActionState(
    startGoogleSignIn,
    idleAuthState,
  );

  return (
    <form action={submit} className="form-stack google-form">
      <input type="hidden" name="next" value={next} />
      <AuthStatus state={state} />
      <button
        type="submit"
        className="button button-outline"
        disabled={pending}
      >
        {pending ? "Opening Google…" : "Continue with Google"}
      </button>
    </form>
  );
}
