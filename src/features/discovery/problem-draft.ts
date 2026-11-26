import { z } from "zod";
import { featuredCategories } from "./sample-problems";

export const problemDraftSchema = z.object({
  title: z
    .string()
    .trim()
    .min(8, "Use at least 8 characters for the title.")
    .max(100),
  description: z
    .string()
    .trim()
    .min(20, "Use at least 20 characters to describe the problem.")
    .max(2000),
  category: z.enum(
    featuredCategories.map(({ name }) => name),
    { error: "Choose a category." },
  ),
  skills: z.string().trim().max(180),
});
