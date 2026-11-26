import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ActionForm } from "@/components/action-form";
import { PageIntro } from "@/components/page-intro";
import { requireMember } from "@/features/auth/member";
import { setProblemStatus } from "@/features/problems/problem-actions";
import { findProblem, listCategories } from "@/features/problems/problem-data";
import { ProblemForm } from "@/features/problems/problem-form";
import {
  problemDraftSchema,
  problemStatusLabel,
} from "@/features/problems/problem-validation";

export const metadata = { title: "Edit problem", robots: { index: false } };

export default async function EditProblemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!z.uuid().safeParse(slug).success) notFound();
  const { supabase, userId } = await requireMember(
    `/problems/${slug}/edit`,
    true,
  );
  const [record, catalog] = await Promise.all([
    findProblem(supabase, slug),
    listCategories(supabase),
  ]);
  if (record.error || catalog.error)
    throw new Error("Could not load the problem editor.");
  const problem = record.data;
  if (!problem || problem.author_id !== userId || problem.status === "removed")
    notFound();
  const statusOptions =
    problem.status === "archived"
      ? [{ status: "closed", label: "Restore problem" }]
      : [
          problem.status === "open"
            ? { status: "closed", label: "Close requests" }
            : { status: "open", label: "Open requests" },
          { status: "archived", label: "Archive problem" },
        ];

  return (
    <>
      <PageIntro
        title="Edit problem"
        description="Update your post or change whether it accepts connection requests."
      />
      <div className="problem-management">
        <Link href="/my-posts" className="text-link">
          My posts
        </Link>
        <span className="sample-label">
          {problemStatusLabel[problem.status]}
        </span>
        {statusOptions.map(({ status, label }) => (
          <ActionForm
            key={status}
            action={setProblemStatus.bind(null, slug)}
            label={label}
          >
            <input type="hidden" name="status" value={status} />
          </ActionForm>
        ))}
      </div>
      <ProblemForm
        id={slug}
        categories={catalog.data ?? []}
        initial={problemDraftSchema.parse(problem)}
      />
    </>
  );
}
