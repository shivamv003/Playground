import { ArrowRight, ArrowUpRight, Compass, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { listProblems } from "@/features/problems/problem-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProblemCard } from "@/features/discovery/problem-card";
import {
  exploreCategoryHref,
  featuredCategories,
  sampleProblems,
} from "@/features/discovery/sample-problems";

export default async function HomePage() {
  const supabase = await createServerSupabaseClient({ readOnly: true });
  const live = supabase ? await listProblems(supabase, { pageSize: 6 }) : null;
  const problems = live?.problems ?? sampleProblems;

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-content">
          <h1 id="hero-title">
            Great ideas deserve
            <br className="hero-break" /> <em>the right people.</em>
          </h1>
          <p className="hero-description">
            Discover real-world problems, meet people with complementary skills,
            and build something that matters.
          </p>
          <div className="hero-actions">
            <Link href="/explore" className="button button-primary">
              <Compass size={19} aria-hidden="true" /> Explore problems{" "}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link href="/create" className="button button-outline">
              <Plus size={19} aria-hidden="true" /> Post a problem
            </Link>
          </div>
        </div>
        <div className="hero-art">
          <Image
            src="/images/playground-collage.webp"
            alt=""
            fill
            sizes="(max-width: 720px) min(90vw, 480px), 560px"
            preload
          />
        </div>
      </section>

      <section
        className="categories-section"
        aria-labelledby="categories-title"
      >
        <div className="section-heading">
          <h2 id="categories-title">Explore by category</h2>
          <Link href="/explore" className="text-link">
            All categories <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
        <ul className="category-grid">
          {featuredCategories.map(({ name, slug, icon: Icon, color }) => (
            <li key={name}>
              <Link
                href={exploreCategoryHref(supabase ? slug : name)}
                className={`category-link tone-${color}`}
              >
                <Icon size={21} strokeWidth={1.9} aria-hidden="true" />{" "}
                <span>{name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="feed-section" aria-labelledby="feed-title">
        <div className="section-heading feed-heading">
          <div>
            <h2 id="feed-title">
              Problems worth solving<span className="heading-period">.</span>
            </h2>
            <p>
              Find an idea you’d like to help bring to life.{" "}
              {!supabase && (
                <span className="sample-label">Sample problems</span>
              )}
            </p>
          </div>
          <Link href="/explore" className="button button-outline button-small">
            View all problems <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
        {live?.error ? (
          <p className="notice form-error" role="alert">
            We couldn’t load the feed. Refresh the page to try again.
          </p>
        ) : problems.length ? (
          <div className="problem-grid">
            {problems.map((problem) => (
              <ProblemCard key={problem.slug} problem={problem} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>Be the first to post a problem</h3>
            <p>
              Tell other builders what you want to tackle and where you need
              help.
            </p>
            <Link href="/create" className="button button-primary">
              Post a problem
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
