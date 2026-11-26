import { Search } from "lucide-react";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { Pagination } from "@/components/pagination";
import { ProblemCard } from "@/features/discovery/problem-card";
import {
  featuredCategories,
  sampleProblems,
} from "@/features/discovery/sample-problems";
import { pageNumber } from "@/features/problems/pagination";
import { listCategories, listProblems } from "@/features/problems/problem-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = { title: "Explore" };

type ExploreParams = Record<string, string | string[] | undefined>;

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<ExploreParams>;
}) {
  const params = await searchParams;
  const query =
    typeof params.q === "string" ? params.q.trim().slice(0, 120) : "";
  const requestedCategory =
    typeof params.category === "string" ? params.category : "";
  const page = pageNumber(params.page);
  const acceptingOnly = params.open === "1";
  const supabase = await createServerSupabaseClient({ readOnly: true });
  const catalog = supabase ? await listCategories(supabase) : null;
  const categories = catalog
    ? (catalog.data ?? [])
    : featuredCategories.map(({ name, slug }) => ({ name, slug, id: slug }));
  const category =
    categories.find(
      ({ name, slug }) =>
        name === requestedCategory || slug === requestedCategory,
    ) ??
    categories.find(
      ({ slug }) =>
        requestedCategory === "Software" && slug === "software-development",
    );
  const live =
    supabase && !catalog?.error
      ? await listProblems(supabase, {
          query,
          categoryId: category?.id,
          page,
          acceptingOnly,
        })
      : null;
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const results =
    live?.problems ??
    sampleProblems.filter((problem) => {
      const text = [
        problem.title,
        problem.description,
        problem.category,
        ...problem.skills,
      ]
        .join(" ")
        .toLowerCase();
      return (
        (!category || category.name === problem.category) &&
        terms.every((term) => text.includes(term))
      );
    });

  function searchHref(nextPage: number) {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (category) next.set("category", category.slug);
    if (acceptingOnly) next.set("open", "1");
    if (nextPage > 1) next.set("page", String(nextPage));
    return next.size ? `/explore?${next}` : "/explore";
  }

  return (
    <>
      <PageIntro
        title="Explore problems"
        description="Find a problem that sparks your curiosity or calls for your skills."
      />
      <form
        action="/explore"
        className="search-form"
        aria-label="Search problems"
        role="search"
        key={searchHref(page)}
      >
        <label htmlFor="search" className="sr-only">
          Search by problem or skill
        </label>
        <label htmlFor="category" className="sr-only">
          Category
        </label>
        <div className="search-field">
          <Search size={19} aria-hidden="true" />
          <input
            id="search"
            name="q"
            placeholder="Search by problem or skill"
            maxLength={120}
            defaultValue={query}
          />
        </div>
        <select
          id="category"
          name="category"
          defaultValue={category?.slug ?? ""}
        >
          <option value="">All categories</option>
          {categories.map(({ name, slug }) => (
            <option key={slug} value={slug}>
              {name}
            </option>
          ))}
        </select>
        {supabase && (
          <label className="filter-checkbox">
            <input
              type="checkbox"
              name="open"
              value="1"
              defaultChecked={acceptingOnly}
            />{" "}
            Accepting collaborators
          </label>
        )}
        <button className="button button-primary" type="submit">
          Search
        </button>
      </form>
      <section aria-labelledby="results-title">
        <div className="section-heading">
          <h2 id="results-title">
            {category?.name ?? "Results"}{" "}
            {!supabase && <span className="sample-label">Sample problems</span>}
          </h2>
          {(query || category || acceptingOnly) && (
            <Link href="/explore" className="text-link">
              Clear filters
            </Link>
          )}
        </div>
        {catalog?.error || live?.error ? (
          <p className="notice form-error" role="alert">
            We couldn’t load the results. Refresh the page to try again.
          </p>
        ) : results.length ? (
          <div className="problem-grid">
            {results.map((problem) => (
              <ProblemCard key={problem.slug} problem={problem} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Search size={28} aria-hidden="true" />
            <h3>No problems found</h3>
            <p>
              {query || category || acceptingOnly
                ? "Try a different keyword or browse all categories."
                : "New problems will appear here when builders publish them."}
            </p>
            {query || category || acceptingOnly ? (
              <Link href="/explore" className="button button-outline">
                Clear search
              </Link>
            ) : (
              <Link href="/create" className="button button-primary">
                Post a problem
              </Link>
            )}
          </div>
        )}
        {live && !live.error && (
          <Pagination
            page={page}
            hasNext={live.hasNext && page < 1000}
            getHref={searchHref}
          />
        )}
      </section>
    </>
  );
}
