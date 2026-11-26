import { ArrowUpRight, UsersRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { SampleProblem } from "./sample-problems";

export function ProblemCard({ problem }: { problem: SampleProblem }) {
  const href = `/problems/${problem.slug}`;

  return (
    <article className="problem-card">
      <div className={`card-cover tone-${problem.color}`}>
        <Image
          src={problem.image}
          alt=""
          fill
          sizes="(max-width: 530px) 92vw, (max-width: 820px) 46vw, 400px"
        />
        <span className="cover-label">{problem.category}</span>
      </div>
      <div className="card-body">
        <div className="card-author">
          <span className={`avatar tone-${problem.color}`} aria-hidden="true">
            {problem.initials}
          </span>
          <span>{problem.author}</span>
        </div>
        <h3>
          <Link href={href}>{problem.title}</Link>
        </h3>
        <p>{problem.description}</p>
        <ul className="skills" aria-label="Skills needed">
          {problem.skills.map((skill) => (
            <li key={skill}>{skill}</li>
          ))}
        </ul>
        <div className="card-footer">
          <span>
            <UsersRound size={16} aria-hidden="true" /> {problem.purpose}
          </span>
          <Link
            href={href}
            className="text-link"
            aria-label={`View problem: ${problem.title}`}
          >
            View problem <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
