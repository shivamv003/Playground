import { z } from "zod";

export const contactKinds = [
  "email",
  "phone",
  "linkedin",
  "github",
  "portfolio",
  "discord",
  "other",
] as const;
export type ContactKind = (typeof contactKinds)[number];

export const contactLabels: Record<ContactKind, string> = {
  email: "Email",
  phone: "Phone",
  linkedin: "LinkedIn",
  github: "GitHub",
  portfolio: "Portfolio",
  discord: "Discord",
  other: "Other contact",
};

export const contactSchema = z
  .object({
    kind: z.enum(contactKinds),
    value: z
      .string()
      .trim()
      .min(1, "Enter the detail you want to share.")
      .max(300)
      .regex(/^[^\p{Cc}]+$/u, "Use one line for the contact detail."),
  })
  .superRefine(({ kind, value }, ctx) => {
    if (kind === "email" && !z.email().safeParse(value).success) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a valid email address.",
        path: ["value"],
      });
    }
    if (kind === "phone" && !/^\+?[\d ()-]{5,30}$/.test(value)) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a valid phone number.",
        path: ["value"],
      });
    }
    if (
      ["linkedin", "github", "portfolio"].includes(kind) &&
      !z
        .url({ protocol: /^https?$/, hostname: z.regexes.domain })
        .safeParse(value).success
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a full https:// or http:// link.",
        path: ["value"],
      });
    }
  });

export const requestOperations = [
  "accepted",
  "declined",
  "cancelled",
  "disconnected",
] as const;
export type RequestStatus = "pending" | (typeof requestOperations)[number];

export const requestLabels: Record<RequestStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
  cancelled: "Cancelled",
  disconnected: "Disconnected",
};
