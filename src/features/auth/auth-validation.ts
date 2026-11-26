import { z } from "zod";

export const emailSchema = z
  .email("Enter a valid email address.")
  .trim()
  .toLowerCase()
  .max(254);
const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters for the password.")
  .max(72);

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password.").max(72),
});

export const resetSchema = z
  .object({
    password: passwordSchema,
    confirmation: z.string(),
  })
  .refine(({ password, confirmation }) => password === confirmation, {
    message: "The passwords must match.",
    path: ["confirmation"],
  });

export function isEmailToken(value: unknown): value is string {
  return typeof value === "string" && /^[a-zA-Z0-9_-]{20,128}$/.test(value);
}
