import Link from "next/link";

export function Pagination({
  page,
  hasNext,
  getHref,
}: {
  page: number;
  hasNext: boolean;
  getHref: (page: number) => string;
}) {
  if (page === 1 && !hasNext) return null;

  return (
    <nav className="pagination" aria-label="Results pagination">
      {page > 1 && (
        <Link
          className="button button-outline button-small"
          href={getHref(page - 1)}
        >
          Previous page
        </Link>
      )}
      <span>Page {page}</span>
      {hasNext && (
        <Link
          className="button button-outline button-small"
          href={getHref(page + 1)}
        >
          Next page
        </Link>
      )}
    </nav>
  );
}
