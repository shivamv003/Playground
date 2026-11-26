const returnOrigin = "https://playground.invalid";
const allowedPath =
  /^\/(?:explore|create|activity|profile(?:\/edit)?|problems\/[a-zA-Z0-9-]+|people\/[a-z0-9_]+)?$/;

export function safeReturnPath(value: unknown) {
  if (
    typeof value !== "string" ||
    value.length > 1000 ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\s]/.test(value)
  ) {
    return "/";
  }

  const url = new URL(value, returnOrigin);
  if (url.origin !== returnOrigin || !allowedPath.test(url.pathname))
    return "/";

  return url.pathname + url.search + url.hash;
}

export function withReturnPath(path: string, next: unknown) {
  const query = new URLSearchParams({ next: safeReturnPath(next) });
  return `${path}?${query}`;
}
