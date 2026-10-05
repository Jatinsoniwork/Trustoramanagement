import { z } from "zod";

export const reviewRequestSchema = z.object({
  businessId: z.string().min(1, "Business selection is required"),
  googleAccountId: z.string().optional().nullable(),
  experience: z
    .string()
    .min(10, "Customer genuine experience must contain at least 10 characters")
    .max(3000, "Customer experience cannot exceed 3000 characters"),
  rating: z
    .number()
    .int()
    .min(1, "Rating must be between 1 and 5 stars")
    .max(5, "Rating must be between 1 and 5 stars"),
  language: z
    .string()
    .min(2, "Language code is required")
    .default("en"),
  tone: z
    .string()
    .max(50)
    .optional()
    .default("authentic"),
  keywords: z.string().max(300).optional().nullable(),
  requestedLength: z.enum(["short", "standard", "detailed"]).default("standard"),
  status: z
    .enum([
      "DRAFT",
      "GENERATING",
      "GENERATED",
      "EDITED",
      "APPROVED",
      "READY_TO_SUBMIT",
      "REDIRECTED",
      "COMPLETED",
      "FAILED",
      "CANCELLED",
    ])
    .default("DRAFT"),
});

export type ReviewRequestInput = z.infer<typeof reviewRequestSchema>;

export const generateReviewSchema = z.object({
  rating: z
    .number({
      required_error: "Please select a rating.",
      invalid_type_error: "Please select a rating.",
    })
    .int()
    .min(1, "Please select a rating.")
    .max(5, "Rating must be between 1 and 5 stars."),
  feedback: z
    .string({
      required_error: "Please tell us a little about your experience.",
      invalid_type_error: "Please tell us a little about your experience.",
    })
    .trim()
    .min(10, "Please tell us a little about your experience (at least 10 characters).")
    .max(2000, "Customer feedback cannot exceed 2000 characters."),
  service: z.string().max(150).optional().nullable(),
  highlights: z.string().max(200).optional().nullable(),
  recommendation: z.boolean().optional().nullable(),
  staffMention: z.string().max(100).optional().nullable(),
  businessName: z.string().max(120).optional(),
  businessCategory: z.string().max(80).optional(),
  reviewRequestId: z.string().optional(),
  businessId: z.string().optional(),
});

export type GenerateReviewValidationInput = z.infer<typeof generateReviewSchema>;

export const reviewDraftSchema = z.object({
  reviewRequestId: z.string().min(1, "Review request ID is required"),
  content: z
    .string()
    .min(5, "Draft review content must be at least 5 characters")
    .max(4000, "Draft content cannot exceed 4000 characters"),
  version: z.number().int().min(1).default(1),
  isCurrent: z.boolean().default(true),
});

export type ReviewDraftInput = z.infer<typeof reviewDraftSchema>;
