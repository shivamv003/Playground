"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { AuthState } from "@/features/auth/auth-state";
import { requireMember } from "@/features/auth/member";
import { managedStatuses, publishProblemSchema } from "./problem-validation";

function refreshDiscovery(problemId: string) {
  for (const path of [
    "/",
    "/explore",
    "/my-posts",
    "/activity",
    `/problems/${problemId}`,
  ]) {
    revalidatePath(path);
  }
}

export async function saveProblem(
  id: string | null,
  _previous: AuthState,
  form: FormData,
): Promise<AuthState> {
  if (id && !z.uuid().safeParse(id).success)
    return { status: "error", message: "This problem is unavailable." };
  const next = id ? `/problems/${id}/edit` : "/create";
  const { supabase, userId } = await requireMember(next);
  const input = publishProblemSchema.safeParse(Object.fromEntries(form));
  if (!input.success)
    return { status: "error", message: input.error.issues[0].message };

  const mutation = id
    ? supabase
        .from("problems")
        .update(input.data)
        .eq("id", id)
        .eq("author_id", userId)
    : supabase.from("problems").insert({ ...input.data, author_id: userId });
  const { data, error } = await mutation.select("id").maybeSingle();
  if (error?.code === "PT429")
    return {
      status: "error",
      message: "You’ve reached the hourly publishing limit. Try again later.",
    };
  if (!data || error)
    return {
      status: "error",
      message:
        "We couldn’t save this problem. Check the category or try again.",
    };

  refreshDiscovery(data.id);
  redirect(`/problems/${data.id}`);
}

export async function setProblemStatus(
  id: string,
  _previous: AuthState,
  form: FormData,
): Promise<AuthState> {
  if (!z.uuid().safeParse(id).success)
    return { status: "error", message: "This problem is unavailable." };
  const { supabase, userId } = await requireMember(`/problems/${id}/edit`);
  const nextStatus = z.enum(managedStatuses).safeParse(form.get("status"));
  if (!nextStatus.success)
    return { status: "error", message: "Choose a problem status." };

  const { data, error } = await supabase
    .from("problems")
    .update({ status: nextStatus.data })
    .eq("id", id)
    .eq("author_id", userId)
    .select("id")
    .maybeSingle();
  if (!data || error)
    return {
      status: "error",
      message: "We couldn’t change the status of this problem.",
    };

  refreshDiscovery(id);
  revalidatePath(`/problems/${id}/edit`);
  return { status: "success", message: "Problem status updated." };
}
