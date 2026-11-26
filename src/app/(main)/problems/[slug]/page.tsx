import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { z } from "zod";
import { SampleProblemPage } from "@/features/discovery/sample-problem-page";
import { sampleProblems } from "@/features/discovery/sample-problems";
import { findProblem } from "@/features/problems/problem-data";
import { PublishedProblemPage } from "@/features/problems/published-problem-page";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ProblemPageProps = { params: Promise<{ slug: string }> };

const loadPublicProblem = cache(async (slug: string) => {
  if (!z.uuid().safeParse(slug).success) return null;
  const supabase = await createServerSupabaseClient({ readOnly: true });
  if (!supabase) return null;
  const result = await findProblem(supabase, slug);
  if (result.error) throw new Error("Could not load this problem.");
  return result.data ? { problem: result.data, supabase } : null;
});

export function generateStaticParams() {
  return sampleProblems.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ProblemPageProps): Promise<Metadata> {
  const { slug } = await params;
  const sample = sampleProblems.find((entry) => entry.slug === slug);
  if (sample)
    return {
      title: sample.title,
      description: sample.description,
      robots: { index: false },
    };

  const record = await loadPublicProblem(slug);
  if (!record) return {};
  const { problem } = record;
  const isPublic = problem.status === "open" || problem.status === "closed";
  const description = problem.description.slice(0, 180);
  return {
    title: problem.title,
    description,
    ...(isPublic
      ? { openGraph: { title: problem.title, description } }
      : { robots: { index: false } }),
  };
}

export default async function ProblemPage({ params }: ProblemPageProps) {
  const { slug } = await params;
  const sample = sampleProblems.find((entry) => entry.slug === slug);
  if (sample) return <SampleProblemPage problem={sample} />;

  const record = await loadPublicProblem(slug);
  if (!record) notFound();
  return (
    <PublishedProblemPage problem={record.problem} supabase={record.supabase} />
  );
}
