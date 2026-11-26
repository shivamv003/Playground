import type { Instrumentation } from "next";

export const onRequestError: Instrumentation.onRequestError = (
  error,
  request,
  context,
) => {
  const digest =
    error instanceof Error &&
    "digest" in error &&
    typeof error.digest === "string" &&
    /^\d{1,20}$/.test(error.digest)
      ? error.digest
      : undefined;
  // Route templates omit query strings, IDs, email tokens, and form values.
  console.error("Playground request failed", {
    route: context.routePath,
    method: request.method,
    digest,
  });
};
