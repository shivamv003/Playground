"use client";

export default function PageError({ reset }: { reset: () => void }) {
  return (
    <section className="empty-state">
      <h1>We couldn’t load this page</h1>
      <p>Try again in a moment.</p>
      <button className="button button-primary" type="button" onClick={reset}>
        Try again
      </button>
    </section>
  );
}
