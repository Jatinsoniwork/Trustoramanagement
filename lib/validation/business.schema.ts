import { z } from "zod";

export const businessSchema = z.object({
  clientId: z.string().min(1, "Client assignment is required"),
  name: z
    .string()
    .min(2, "Business name must be at least 2 characters")
    .max(120, "Business name cannot exceed 120 characters"),
  googleMapsUrl: z
    .string()
    .url("Must be a valid URL (e.g. https://maps.google.com/...)")
    .max(500, "Google Maps URL is too long"),
  googleReviewUrl: z
    .string()
    .url("Must be a valid Google Review URL (e.g. https://g.page/r/.../review)")
    .max(500, "Google Review URL is too long")
    .optional()
    .nullable()
    .or(z.literal("")),
  placeIdentifier: z.string().max(100).optional().nullable(),
  category: z
    .string()
    .min(2, "Category is required (e.g. Restaurant, Dental Clinic)")
    .max(80, "Category cannot exceed 80 characters"),
  location: z
    .string()
    .min(2, "Location is required (e.g. City, Address)")
    .max(200, "Location cannot exceed 200 characters"),
  notes: z.string().max(1000).optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export type BusinessInput = z.infer<typeof businessSchema>;
