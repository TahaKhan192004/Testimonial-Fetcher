import { z } from "zod";
import { PERMISSION_KEYS, Q1_KEYS, Q2_KEYS, Q3_KEYS, Q4_KEYS } from "./options";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Enter a valid email address");

export const nameSchema = z.string().trim().min(1, "Tell us your name").max(120);
export const businessSchema = z.string().trim().min(1, "Tell us your business name").max(160);

export const answersSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    business_name: businessSchema,
    q1_prior_ai_use: z.enum(Q1_KEYS),
    q2_focus_area: z.enum(Q2_KEYS),
    q2_other_text: z.string().trim().max(200).optional().nullable(),
    q3_experience: z.enum(Q3_KEYS),
    q4_blocker: z.enum(Q4_KEYS),
    q5_experience_text: z.string().trim().min(10, "Write at least a sentence").max(3000),
    q6_recommendation: z.string().trim().min(10, "Write at least a sentence").max(3000),
    // The form no longer asks. New submissions are private until an admin changes it.
    testimonial_permission: z.enum(PERMISSION_KEYS).default("no"),
  })
  .refine((v) => v.q2_focus_area !== "other" || (v.q2_other_text ?? "").trim().length > 0, {
    message: "Tell us which role",
    path: ["q2_other_text"],
  });

export type Answers = z.infer<typeof answersSchema>;

export const submitSchema = z.object({
  answers: answersSchema,
  src: z.string().trim().max(120).optional().nullable(),
  elapsedMs: z
    .number()
    .int()
    .min(0)
    .max(1000 * 60 * 60 * 24)
    .optional(),
  sessionId: z.string().trim().max(64).optional().nullable(),
  /** Honeypot. Real users never see or fill this. */
  website: z.string().max(500).optional().nullable(),
});
export type SubmitPayload = z.infer<typeof submitSchema>;

export const trackSchema = z.object({
  sessionId: z.string().trim().min(8).max(64),
  step: z.number().int().min(0).max(20),
  src: z.string().trim().max(120).optional().nullable(),
});
