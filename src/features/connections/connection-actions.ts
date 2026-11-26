"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { AuthState } from "@/features/auth/auth-state";
import { requireMember } from "@/features/auth/member";
import { safeReturnPath } from "@/features/auth/return-path";
import { mutationStatus } from "@/lib/supabase/mutation-status";
import {
  contactKinds,
  contactSchema,
  requestOperations,
} from "./connection-validation";

function refreshActivity(next = "/activity") {
  revalidatePath("/activity");
  if (next !== "/activity") revalidatePath(next.split(/[?#]/, 1)[0]);
}

export async function sendConnectionRequest(
  id: string,
  _previous: AuthState,
  form: FormData,
): Promise<AuthState> {
  const input = z
    .object({ id: z.uuid(), message: z.string().trim().max(500) })
    .safeParse({ id, message: form.get("message") });
  if (!input.success)
    return { status: "error", message: "Check your message and try again." };
  const next = `/problems/${id}`;
  const { supabase } = await requireMember(next);
  const { error } = await supabase.rpc("send_connection_request", {
    target_problem: id,
    note: input.data.message,
  });
  if (!error) refreshActivity(next);
  return mutationStatus(
    error,
    "Connection request sent.",
    "We couldn’t send your request. Try again.",
  );
}

export async function changeRequest(
  id: string,
  _previous: AuthState,
  form: FormData,
): Promise<AuthState> {
  const input = z
    .object({ id: z.uuid(), operation: z.enum(requestOperations) })
    .safeParse({ id, operation: form.get("operation") });
  if (!input.success)
    return { status: "error", message: "Choose a request action." };
  const { supabase } = await requireMember("/activity");
  const { error } = await supabase.rpc("change_connection_request", {
    target_request: id,
    operation: input.data.operation,
  });
  if (!error) refreshActivity();
  return mutationStatus(
    error,
    "Connection updated.",
    "We couldn’t update this request. Try again.",
  );
}

export async function shareContact(
  id: string,
  _previous: AuthState,
  form: FormData,
): Promise<AuthState> {
  if (!z.uuid().safeParse(id).success)
    return { status: "error", message: "This request is unavailable." };
  const input = contactSchema.safeParse(Object.fromEntries(form));
  if (!input.success)
    return { status: "error", message: input.error.issues[0].message };
  const { supabase } = await requireMember("/activity");
  const { error } = await supabase.rpc("share_contact", {
    target_request: id,
    field_kind: input.data.kind,
    field_value: input.data.value,
  });
  if (!error) refreshActivity();
  return mutationStatus(
    error,
    "Contact detail shared.",
    "We couldn’t share this detail. Try again.",
  );
}

export async function revokeContact(
  id: string,
  kind: string,
): Promise<AuthState> {
  if (
    !z.uuid().safeParse(id).success ||
    !z.enum(contactKinds).safeParse(kind).success
  ) {
    return { status: "error", message: "This contact detail is unavailable." };
  }
  const { supabase } = await requireMember("/activity");
  const { error } = await supabase.rpc("revoke_contact", {
    target_request: id,
    field_kind: kind,
  });
  if (!error) refreshActivity();
  return mutationStatus(
    error,
    "Contact detail removed.",
    "We couldn’t remove this contact detail. Try again.",
  );
}

export async function changeBlock(
  userId: string,
  shouldBlock: boolean,
  next: string,
): Promise<AuthState> {
  if (!z.uuid().safeParse(userId).success)
    return { status: "error", message: "This profile is unavailable." };
  const path = safeReturnPath(next);
  const { supabase } = await requireMember(path);
  const { error } = await supabase.rpc("set_user_block", {
    target_user: userId,
    should_block: shouldBlock,
  });
  if (!error) refreshActivity(path);
  return mutationStatus(
    error,
    shouldBlock ? "This person is blocked." : "This person is unblocked.",
    "We couldn’t update this block. Try again.",
  );
}
