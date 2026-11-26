import { z } from "zod";

export const usernamePattern = /^[a-z0-9_]{3,24}$/;

function tagsSchema(label: string) {
  return z
    .string()
    .max(340, `Use no more than 10 ${label}.`)
    .transform((value) => {
      const uniqueTags = new Map<string, string>();
      for (const item of value.split(",")) {
        const tag = item.trim();
        if (tag && !uniqueTags.has(tag.toLowerCase())) {
          uniqueTags.set(tag.toLowerCase(), tag);
        }
      }
      return [...uniqueTags.values()];
    })
    .pipe(
      z
        .array(
          z
            .string()
            .max(32, `Each item in ${label} can be at most 32 characters.`),
        )
        .max(10, `Use no more than 10 ${label}.`),
    );
}

export const profileSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      usernamePattern,
      "Use 3–24 letters, numbers, or underscores for your username.",
    ),
  display_name: z
    .string()
    .trim()
    .min(2, "Enter a display name with at least 2 characters.")
    .max(60, "Use at most 60 characters for your display name."),
  headline: z
    .string()
    .trim()
    .max(100, "Use at most 100 characters for your headline."),
  bio: z.string().trim().max(400, "Use at most 400 characters for your bio."),
  skills: tagsSchema("skills"),
  interests: tagsSchema("interests"),
});

export type ProfileContent = z.infer<typeof profileSchema>;
