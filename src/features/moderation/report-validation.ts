export const reportReasonCodes = [
  "spam",
  "scam",
  "harassment",
  "inappropriate",
  "fake_profile",
  "other",
] as const;
export type ReportReason = (typeof reportReasonCodes)[number];

export const reportReasons: Record<ReportReason, string> = {
  spam: "Spam",
  scam: "Scam",
  harassment: "Harassment",
  inappropriate: "Inappropriate content",
  fake_profile: "Fake profile",
  other: "Other",
};

export type ReportTarget = { kind: "problem" | "profile"; id: string };
