import Link from "next/link";

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Playground home">
      <span className="brand-mark" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      playground<span className="brand-period">.</span>
    </Link>
  );
}
