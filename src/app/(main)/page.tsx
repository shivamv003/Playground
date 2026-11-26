import { ArrowRight, ArrowUpRight, Compass, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ProblemCard } from "@/features/discovery/problem-card";
import {
  exploreCategoryHref,
  featuredCategories,
  sampleProblems,
} from "@/features/discovery/sample-problems";

export default function HomePage() {
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
          {featuredCategories.map(({ name, icon: Icon, color }) => (
            <li key={name}>
              <Link
                href={exploreCategoryHref(name)}
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
              <span className="sample-label">Sample problems</span>
            </p>
          </div>
          <Link href="/explore" className="button button-outline button-small">
            View all problems <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
        <div className="problem-grid">
          {sampleProblems.map((problem) => (
            <ProblemCard key={problem.slug} problem={problem} />
          ))}
        </div>
      </section>
    </>
  );
}
