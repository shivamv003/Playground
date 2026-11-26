import { ArrowLeft, UsersRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { withReturnPath } from "@/features/auth/return-path";
import { getViewerId } from "@/features/auth/viewer";
import { readSupabaseConfig } from "@/lib/supabase/config";
import { exploreCategoryHref, type SampleProblem } from "./sample-problems";

export async function SampleProblemPage({
  problem,
}: {
  problem: SampleProblem;
}) {
  const { slug } = problem;

  const canCreateAccount =
    Boolean(readSupabaseConfig()) && !(await getViewerId());

  return (
    <article className="details">
      <Link href="/explore" className="text-link">
        <ArrowLeft size={16} aria-hidden="true" /> Back to Explore
      </Link>
      <header className="page-intro">
        <div className="detail-tags">
          <Link
            href={exploreCategoryHref(problem.category)}
            className={`category-link tone-${problem.color}`}
          >
            {problem.category}
          </Link>
          <span className="sample-label">Sample problem</span>
        </div>
        <h1>{problem.title}</h1>
        <p>{problem.description}</p>
        <div className="card-author">
          <span className={`avatar tone-${problem.color}`} aria-hidden="true">
            {problem.initials}
          </span>
          {problem.author} · {problem.purpose}
        </div>
      </header>
      <div className={`detail-cover card-cover tone-${problem.color}`}>
        <Image
          src={problem.image}
          alt=""
          fill
          sizes="(max-width: 800px) 92vw, 760px"
        />
      </div>
      <section className="detail-section">
        <h2>About the problem</h2>
        <p>{problem.context}</p>
      </section>
      <section className="detail-section">
        <h2>Skills needed</h2>
        <ul className="skills">
          {problem.skills.map((skill) => (
            <li key={skill}>{skill}</li>
          ))}
        </ul>
      </section>
      <div className="notice">
        <UsersRound size={20} aria-hidden="true" />
        <p>
          This example shows how a Playground post looks. Explore live problems
          to meet collaborators.
        </p>
      </div>
      {canCreateAccount && (
        <Link
          className="button button-primary detail-account"
          href={withReturnPath("/signup", `/problems/${slug}`)}
        >
          Create a profile
        </Link>
      )}
    </article>
  );
}
