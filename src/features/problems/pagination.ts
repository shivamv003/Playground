export function pageNumber(value: unknown) {
  if (typeof value !== "string" || !/^\d{1,4}$/.test(value)) return 1;
  return Math.max(1, Math.min(Number(value), 1000));
}
