import { Search } from "lucide-react";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { ProblemCard } from "@/features/discovery/problem-card";
import {
  featuredCategories,
  sampleProblems,
} from "@/features/discovery/sample-problems";

export const metadata = { title: "Explore" };

type ExploreParams = { q?: string | string[]; category?: string | string[] };

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<ExploreParams>;
}) {
  const params = await searchParams;
  const query =
    typeof params.q === "string" ? params.q.trim().slice(0, 120) : "";
  const category =
    featuredCategories.find(({ name }) => name === params.category)?.name ?? "";
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const results = sampleProblems.filter((problem) => {
    const searchableText = [
      problem.title,
      problem.description,
      problem.category,
      ...problem.skills,
    ]
      .join(" ")
      .toLowerCase();
    return (
      (!category || problem.category === category) &&
      terms.every((term) => searchableText.includes(term))
    );
  });

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
        <select id="category" name="category" defaultValue={category}>
          <option value="">All categories</option>
          {featuredCategories.map(({ name }) => (
            <option key={name}>{name}</option>
          ))}
        </select>
        <button className="button button-primary" type="submit">
          Search
        </button>
      </form>
      <section aria-labelledby="results-title">
        <div className="section-heading">
          <h2 id="results-title">
            {category || "Results"}{" "}
            <span className="sample-label">Sample problems</span>
          </h2>
          {(query || category) && (
            <Link href="/explore" className="text-link">
              Clear filters
            </Link>
          )}
        </div>
        {results.length > 0 ? (
          <div className="problem-grid">
            {results.map((problem) => (
              <ProblemCard key={problem.slug} problem={problem} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Search size={28} aria-hidden="true" />
            <h3>No problems found</h3>
            <p>Try a different keyword or browse all categories.</p>
            <Link href="/explore" className="button button-outline">
              Clear search
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
