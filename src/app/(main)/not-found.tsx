import Link from "next/link";

export default function NotFound() {
  return (
    <section className="empty-state">
      <h1>Page not found</h1>
      <p>Return to Explore to see the available problems.</p>
      <Link href="/explore" className="button button-primary">
        Explore problems
      </Link>
    </section>
  );
}
