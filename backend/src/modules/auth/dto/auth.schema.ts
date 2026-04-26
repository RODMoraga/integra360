import { z } from "zod";

/** Zod schema for the user registration request body. */
export const registerSchema = z.object({
  fullName: z.string().min(3).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(72)
});

/** Zod schema for the user login request body. */
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72)
});

/** TypeScript type inferred from {@link registerSchema}. */
export type RegisterInput = z.infer<typeof registerSchema>;
/** TypeScript type inferred from {@link loginSchema}. */
export type LoginInput = z.infer<typeof loginSchema>;
