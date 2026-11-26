"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { AuthState } from "@/features/auth/auth-state";
import { requireMember } from "@/features/auth/member";
import { safeReturnPath } from "@/features/auth/return-path";
import { mutationStatus } from "@/lib/supabase/mutation-status";
import { reportReasonCodes, type ReportTarget } from "./report-validation";

const reportSchema = z.object({
  target: z.object({ kind: z.enum(["problem", "profile"]), id: z.uuid() }),
  reason: z.enum(reportReasonCodes),
  details: z.string().trim().max(500),
});

export async function submitReport(
  target: ReportTarget,
  next: string,
  _previous: AuthState,
  form: FormData,
): Promise<AuthState> {
  const input = reportSchema.safeParse({
    target,
    reason: form.get("reason"),
    details: form.get("details"),
  });
  if (!input.success)
    return {
      status: "error",
      message: "Choose a report reason and check your details.",
    };
  const { supabase } = await requireMember(safeReturnPath(next));
  const { error } = await supabase.rpc("submit_playground_report", {
    target_problem: target.kind === "problem" ? target.id : null,
    target_user: target.kind === "profile" ? target.id : null,
    report_reason: input.data.reason,
    report_details: input.data.details,
  });
  if (error?.code === "23505")
    return {
      status: "error",
      message: "You already have an open report for this item.",
    };
  return mutationStatus(
    error,
    "Report sent for review.",
    "We couldn’t send your report. Try again.",
  );
}

export async function reviewReport(
  id: string,
  _previous: AuthState,
  form: FormData,
): Promise<AuthState> {
  const input = z
    .object({
      id: z.uuid(),
      decision: z.enum(["dismissed", "resolved", "remove_problem"]),
    })
    .safeParse({ id, decision: form.get("decision") });
  if (!input.success)
    return { status: "error", message: "Choose a review decision." };
  const { supabase } = await requireMember("/moderation");
  const { error } = await supabase.rpc("review_playground_report", {
    target_report: id,
    decision: input.data.decision,
  });
  if (!error) {
    revalidatePath("/moderation");
    revalidatePath("/");
    revalidatePath("/explore");
    revalidatePath("/problems/[slug]", "page");
    revalidatePath("/my-posts");
  }
  return mutationStatus(
    error,
    "Report reviewed.",
    "We couldn’t update this report. Try again.",
  );
}
