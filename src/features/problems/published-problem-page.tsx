import { ArrowLeft, Pencil, UsersRound } from "lucide-react";
import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { withReturnPath } from "@/features/auth/return-path";
import { getViewerId } from "@/features/auth/viewer";
import { sendConnectionRequest } from "@/features/connections/connection-actions";
import {
  findLatestRequest,
  findOwnBlock,
} from "@/features/connections/connection-data";
import { requestLabels } from "@/features/connections/connection-validation";
import { exploreCategoryHref } from "@/features/discovery/sample-problems";
import { SafetyActions } from "@/features/moderation/safety-actions";
import type { PlaygroundSupabaseClient } from "@/lib/supabase/server";
import { problemCardContent, type PublishedProblem } from "./problem-data";
import { problemStatusLabel } from "./problem-validation";

export async function PublishedProblemPage({
  problem,
  supabase,
}: {
  problem: PublishedProblem;
  supabase: PlaygroundSupabaseClient;
}) {
  const viewerId = await getViewerId();
  const owner = viewerId === problem.author_id;
  const path = `/problems/${problem.id}`;
  const card = problemCardContent(problem);
  const publicPost = problem.status === "open" || problem.status === "closed";
  const [block, request] =
    viewerId && !owner && publicPost
      ? await Promise.all([
          findOwnBlock(supabase, problem.author_id),
          findLatestRequest(supabase, problem.id, viewerId),
        ])
      : [null, null];
  const previous = request?.data;

  const expectations = [
    { label: "Purpose", value: problem.purpose },
    { label: "Work arrangement", value: problem.collaboration_mode },
    { label: "Experience", value: problem.experience },
    { label: "Compensation", value: problem.compensation },
    { label: "Time commitment", value: problem.commitment },
  ];

  return (
    <article className="details">
      <Link href="/explore" className="text-link">
        <ArrowLeft size={16} aria-hidden="true" /> Back to Explore
      </Link>
      <header className="page-intro">
        <div className="detail-tags">
          <Link
            href={exploreCategoryHref(problem.category.slug)}
            className={`category-link tone-${card.color}`}
          >
            {problem.category.name}
          </Link>
          <span className="sample-label">
            {problemStatusLabel[problem.status]}
          </span>
        </div>
        <h1>{problem.title}</h1>
        <div className="card-author">
          <span className={`avatar tone-${card.color}`} aria-hidden="true">
            {card.initials}
          </span>
          <Link
            className="text-link"
            href={`/people/${problem.author.username}`}
          >
            {problem.author.display_name}
          </Link>
        </div>
      </header>
      <section className="detail-section">
        <h2>About the problem</h2>
        <p className="user-copy">{problem.description}</p>
      </section>
      {[
        { title: "Why it matters", value: problem.motivation },
        { title: "Proposed approach", value: problem.approach },
      ]
        .filter(({ value }) => value)
        .map(({ title, value }) => (
          <section className="detail-section" key={title}>
            <h2>{title}</h2>
            <p className="user-copy">{value}</p>
          </section>
        ))}
      {card.skills.length > 0 && (
        <section className="detail-section">
          <h2>Skills needed</h2>
          <ul className="skills">
            {card.skills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        </section>
      )}
      <section className="detail-section">
        <h2>Collaboration</h2>
        <dl className="collaboration-details">
          {expectations
            .filter(({ value }) => value)
            .map(({ label, value }) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd className="user-copy">{value}</dd>
              </div>
            ))}
        </dl>
      </section>
      {owner && problem.status !== "removed" && (
        <Link href={`${path}/edit`} className="button button-primary">
          <Pencil size={17} aria-hidden="true" /> Manage problem
        </Link>
      )}
      {!owner && previous && (
        <section className="panel connection-panel">
          <h2>Connection request</h2>
          <p>Status: {requestLabels[previous.status]}</p>
          <Link href="/activity" className="button button-outline">
            View activity
          </Link>
        </section>
      )}
      {!owner && !previous && problem.status === "open" && (
        <section className="panel connection-panel">
          <h2>
            <UsersRound size={20} aria-hidden="true" /> Connect with{" "}
            {problem.author.display_name}
          </h2>
          {!viewerId ? (
            <Link
              href={withReturnPath("/login", path)}
              className="button button-primary"
            >
              Log in to connect
            </Link>
          ) : block?.error || request?.error ? (
            <p className="notice form-error" role="alert">
              We couldn’t check your connection status. Refresh to try again.
            </p>
          ) : block?.data ? (
            <p>You’ve blocked this person. You can manage the block below.</p>
          ) : (
            <ActionForm
              label="Send connection request"
              primary
              action={sendConnectionRequest.bind(null, problem.id)}
            >
              <div className="form-field">
                <label htmlFor="connection-message">
                  Message <span className="optional">(optional)</span>
                </label>
                <textarea
                  id="connection-message"
                  name="message"
                  rows={3}
                  maxLength={500}
                  placeholder="Introduce yourself and share what you’d like to help with."
                />
              </div>
            </ActionForm>
          )}
        </section>
      )}
      {Boolean(viewerId) && !owner && publicPost && (
        <SafetyActions
          target={{ kind: "problem", id: problem.id }}
          authorId={problem.author_id}
          blocked={Boolean(block?.data)}
          next={path}
        />
      )}
    </article>
  );
}
