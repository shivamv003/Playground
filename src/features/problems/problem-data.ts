import { cache } from "react";
import type { PlaygroundSupabaseClient } from "@/lib/supabase/server";
import {
  featuredCategories,
  sampleProblems,
} from "@/features/discovery/sample-problems";
import {
  problemStatusLabel,
  type ProblemDraft,
  type ProblemStatus,
} from "./problem-validation";

export type ProblemCategory = { id: string; name: string; slug: string };

export type PublishedProblem = ProblemDraft & {
  id: string;
  author_id: string;
  status: ProblemStatus;
  created_at: string;
  category: Pick<ProblemCategory, "name" | "slug">;
  author: { display_name: string; username: string };
};

const listFields =
  "id, author_id, category_id, title, description, skills, purpose, status, created_at, category:categories!inner(name,slug), author:profiles!inner(display_name,username)";
const detailFields =
  listFields +
  ", motivation, approach, collaboration_mode, commitment, experience, compensation";

type ProblemListRow = Pick<
  PublishedProblem,
  | "id"
  | "title"
  | "description"
  | "skills"
  | "purpose"
  | "status"
  | "category"
  | "author"
>;

export const listCategories = cache(
  async (supabase: PlaygroundSupabaseClient) => {
    return supabase
      .from("categories")
      .select("id,name,slug")
      .order("name")
      .overrideTypes<ProblemCategory[], { merge: false }>();
  },
);

export async function listProblems(
  supabase: PlaygroundSupabaseClient,
  {
    query = "",
    categoryId,
    page = 1,
    pageSize = 9,
    ownerId,
    acceptingOnly = false,
  }: {
    query?: string;
    categoryId?: string;
    page?: number;
    pageSize?: number;
    ownerId?: string;
    acceptingOnly?: boolean;
  } = {},
) {
  let rows = supabase.from("problems").select(listFields);
  rows = ownerId
    ? rows.eq("author_id", ownerId)
    : rows.in("status", ["open", "closed"]);
  if (query)
    rows = rows.textSearch("search_document", query, {
      type: "websearch",
      config: "simple",
    });
  if (categoryId) rows = rows.eq("category_id", categoryId);
  if (acceptingOnly) rows = rows.eq("status", "open");

  const offset = (page - 1) * pageSize;
  const { data, error } = await rows
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + pageSize)
    .overrideTypes<ProblemListRow[], { merge: false }>();
  return {
    problems: data?.slice(0, pageSize).map(problemCardContent) ?? [],
    hasNext: Boolean(data && data.length > pageSize),
    error,
  };
}

export const findProblem = cache(
  async (supabase: PlaygroundSupabaseClient, id: string) => {
    return supabase
      .from("problems")
      .select(detailFields)
      .eq("id", id)
      .maybeSingle()
      .overrideTypes<PublishedProblem, { merge: false }>();
  },
);

export function skillsList(skills: string) {
  return [
    ...new Set(
      skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
    ),
  ];
}

export function problemCardContent(problem: ProblemListRow) {
  const category = featuredCategories.find(
    ({ slug }) => slug === problem.category.slug,
  );
  const exampleArtwork = sampleProblems.find(
    (sample) => sample.category === problem.category.name,
  )?.image;
  return {
    slug: problem.id,
    title: problem.title,
    description: problem.description,
    author: problem.author.display_name,
    initials: problem.author.display_name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((name) => [...name][0])
      .join("")
      .toLocaleUpperCase(),
    category: problem.category.name,
    image: exampleArtwork,
    color: category?.color ?? "peach",
    skills: skillsList(problem.skills),
    purpose: problem.purpose,
    availability:
      problem.status === "open"
        ? undefined
        : problemStatusLabel[problem.status],
  };
}
