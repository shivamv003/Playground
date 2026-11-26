"use server";

import { redirect } from "next/navigation";
import { readSupabaseConfig } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  emailSchema,
  isEmailToken,
  loginSchema,
  resetSchema,
  signupSchema,
} from "./auth-validation";
import type { AuthState } from "./auth-state";
import { postAuthDestination } from "./destination";
import { withReturnPath } from "./return-path";

const accountUnavailable =
  "Accounts are temporarily unavailable. You can still explore as a guest.";

function failure(message: string): AuthState {
  return { status: "error", message };
}

function success(message: string): AuthState {
  return { status: "success", message };
}

export async function signUp(
  _previous: AuthState,
  form: FormData,
): Promise<AuthState> {
  const input = signupSchema.safeParse(Object.fromEntries(form));
  if (!input.success) return failure(input.error.issues[0].message);

  const config = readSupabaseConfig();
  const supabase = await createServerSupabaseClient();
  if (!config || !supabase) return failure(accountUnavailable);

  const next = form.get("next");
  const emailRedirectTo = new URL(
    withReturnPath("/auth/confirm", next),
    config.origin,
  ).href;
  const { data, error } = await supabase.auth.signUp({
    ...input.data,
    options: { emailRedirectTo },
  });

  if (
    error &&
    error.code !== "user_already_exists" &&
    error.code !== "email_exists"
  ) {
    return failure(
      "We couldn’t start signup. Check your details and try again in a minute.",
    );
  }
  if (data.session && data.user) {
    redirect(await postAuthDestination(supabase, data.user.id, next));
  }
  return success("Check your inbox for an email to confirm your account.");
}

export async function logIn(
  _previous: AuthState,
  form: FormData,
): Promise<AuthState> {
  const input = loginSchema.safeParse(Object.fromEntries(form));
  if (!input.success) return failure(input.error.issues[0].message);

  const supabase = await createServerSupabaseClient();
  if (!supabase) return failure(accountUnavailable);

  const { data, error } = await supabase.auth.signInWithPassword(input.data);
  if (error || !data.user) {
    if (error?.code === "email_not_confirmed") {
      return failure("Confirm your email before logging in.");
    }
    return failure(
      "We couldn’t log you in. Check your email and password and try again.",
    );
  }
  redirect(await postAuthDestination(supabase, data.user.id, form.get("next")));
}

export async function confirmEmail(
  _previous: AuthState,
  form: FormData,
): Promise<AuthState> {
  const token = form.get("token_hash");
  if (!isEmailToken(token))
    return failure("This confirmation link is invalid.");

  const supabase = await createServerSupabaseClient();
  if (!supabase) return failure(accountUnavailable);

  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: "email",
  });
  if (error || !data.user || !data.session) {
    return failure(
      "This confirmation link expired or was already used. Try logging in or signing up again.",
    );
  }
  redirect(await postAuthDestination(supabase, data.user.id, form.get("next")));
}

export async function requestPasswordReset(
  _previous: AuthState,
  form: FormData,
): Promise<AuthState> {
  const email = emailSchema.safeParse(form.get("email"));
  if (!email.success) return failure(email.error.issues[0].message);

  const config = readSupabaseConfig();
  const supabase = await createServerSupabaseClient();
  if (!config || !supabase) return failure(accountUnavailable);

  const redirectTo = new URL(
    withReturnPath("/reset-password", form.get("next")),
    config.origin,
  ).href;
  await supabase.auth.resetPasswordForEmail(email.data, { redirectTo });
  // A uniform response keeps this form from revealing who has an account.
  return success(
    "If an account exists for that email, you’ll receive a password reset link.",
  );
}

export async function resetPassword(
  _previous: AuthState,
  form: FormData,
): Promise<AuthState> {
  const token = form.get("token_hash");
  if (!isEmailToken(token)) return failure("This reset link is invalid.");

  const input = resetSchema.safeParse(Object.fromEntries(form));
  if (!input.success) return failure(input.error.issues[0].message);

  const supabase = await createServerSupabaseClient();
  if (!supabase) return failure(accountUnavailable);

  // Establish a recovery session from the one-time link before changing credentials.
  const recovery = await supabase.auth.verifyOtp({
    token_hash: token,
    type: "recovery",
  });
  if (recovery.error || !recovery.data.session) {
    return failure(
      "This reset link expired or was already used. Request a new link.",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: input.data.password,
  });
  const signOut = await supabase.auth.signOut({ scope: "global" });
  if (signOut.error) await supabase.auth.signOut({ scope: "local" });
  if (error)
    return failure(
      "We couldn’t update your password. Request a new link to try again.",
    );

  const location = new URL(
    withReturnPath("/login", form.get("next")),
    "https://playground.invalid",
  );
  location.searchParams.set("reset", "1");
  redirect(location.pathname + location.search);
}

export async function startGoogleSignIn(
  _previous: AuthState,
  form: FormData,
): Promise<AuthState> {
  const config = readSupabaseConfig();
  const supabase = await createServerSupabaseClient();
  if (
    !config ||
    !supabase ||
    process.env.PLAYGROUND_GOOGLE_SIGN_IN !== "true"
  ) {
    return failure("Google sign-in is temporarily unavailable.");
  }

  const redirectTo = new URL(
    withReturnPath("/auth/callback", form.get("next")),
    config.origin,
  ).href;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data.url)
    return failure("We couldn’t start Google sign-in. Try again or use email.");
  redirect(data.url);
}

export async function logOut() {
  const supabase = await createServerSupabaseClient();
  if (supabase) await supabase.auth.signOut({ scope: "local" });
  redirect("/");
}
