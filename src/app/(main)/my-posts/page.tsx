import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { Pagination } from "@/components/pagination";
import { requireMember } from "@/features/auth/member";
import { ProblemCard } from "@/features/discovery/problem-card";
import { listProblems } from "@/features/problems/problem-data";
import { pageNumber } from "@/features/problems/pagination";

export const metadata = { title: "My posts", robots: { index: false } };

export default async function MyPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const page = pageNumber((await searchParams).page);
  const { supabase, userId } = await requireMember("/my-posts", true);
  const result = await listProblems(supabase, { page, ownerId: userId });

  return (
    <>
      <PageIntro
        title="My posts"
        description="Find your published and archived problems."
      />
      <Link href="/create" className="button button-primary my-posts-create">
        Post a problem
      </Link>
      {result.error ? (
        <p className="notice form-error" role="alert">
          We couldn’t load your posts. Refresh the page to try again.
        </p>
      ) : result.problems.length ? (
        <div className="problem-grid">
          {result.problems.map((problem) => (
            <ProblemCard key={problem.slug} problem={problem} />
          ))}
        </div>
      ) : (
        <section className="empty-state">
          <h2>
            {page === 1
              ? "You haven’t posted a problem yet"
              : "No posts on this page"}
          </h2>
        </section>
      )}
      {!result.error && (
        <Pagination
          page={page}
          hasNext={result.hasNext && page < 1000}
          getHref={(next) =>
            next === 1 ? "/my-posts" : `/my-posts?page=${next}`
          }
        />
      )}
    </>
  );
}
