import { z } from "zod";

export const purposes = [
  "Side project",
  "Learning project",
  "Portfolio project",
  "Startup idea",
  "Hackathon",
  "Open source",
  "Social impact",
] as const;
export const collaborationModes = ["Flexible", "Remote", "In person"] as const;
export const experienceLevels = [
  "Any level",
  "Beginner friendly",
  "Some experience",
  "Experienced",
] as const;
export const compensationTypes = [
  "To be discussed",
  "Unpaid collaboration",
  "Paid",
  "Equity-based",
] as const;

export const problemDraftSchema = z.object({
  title: z
    .string()
    .trim()
    .min(8, "Use at least 8 characters for the title.")
    .max(100),
  description: z
    .string()
    .trim()
    .min(20, "Use at least 20 characters to describe the problem or idea.")
    .max(2000),
  category_id: z.string().trim().min(1, "Choose a category.").max(80),
  skills: z.string().trim().max(180),
  motivation: z.string().trim().max(1000),
  approach: z.string().trim().max(1000),
  purpose: z.enum(purposes),
  collaboration_mode: z.enum(collaborationModes),
  commitment: z.string().trim().max(100),
  experience: z.enum(experienceLevels),
  compensation: z.enum(compensationTypes),
});

export const publishProblemSchema = problemDraftSchema.extend({
  category_id: z.uuid("Choose a valid category."),
});
export const managedStatuses = ["open", "closed", "archived"] as const;
export type ProblemDraft = z.infer<typeof problemDraftSchema>;
export type ProblemStatus = (typeof managedStatuses)[number] | "removed";

export const blankProblem: ProblemDraft = {
  title: "",
  description: "",
  category_id: "",
  skills: "",
  motivation: "",
  approach: "",
  purpose: purposes[0],
  collaboration_mode: collaborationModes[0],
  commitment: "",
  experience: experienceLevels[0],
  compensation: compensationTypes[0],
};

export const problemStatusLabel: Record<ProblemStatus, string> = {
  open: "Open to collaborators",
  closed: "Requests closed",
  archived: "Archived",
  removed: "Removed by moderation",
};
