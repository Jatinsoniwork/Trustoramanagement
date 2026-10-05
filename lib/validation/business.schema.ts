import { z } from "zod";

export function isValidGoogleUrl(val: string): boolean {
  try {
    const trimmed = val.trim();
    if (!trimmed.startsWith("https://")) return false;
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();
    return (
      host === "goo.gl" ||
      host === "maps.app.goo.gl" ||
      host === "g.page" ||
      host.endsWith(".g.page") ||
      host === "google.com" ||
      host.endsWith(".google.com") ||
      host === "google.co.in" ||
      host.endsWith(".google.co.in") ||
      /(^|\.)google\.[a-z.]+$/.test(host)
    );
  } catch {
    return false;
  }
}

export const googleMapsUrlSchema = z
  .string()
  .transform((val) => val.trim())
  .refine((val) => val.length > 0, "Google Maps URL is required")
  .refine((val) => val.length <= 2048, "Google Maps URL cannot exceed 2048 characters")
  .refine((val) => val.startsWith("https://"), "Must use secure HTTPS protocol (https://)")
  .refine(
    (val) => isValidGoogleUrl(val),
    "Must be a valid Google Maps, Search, or Business URL (e.g. https://maps.google.com/..., https://g.page/...)"
  );

export const googleReviewUrlSchema = z
  .string()
  .transform((val) => val.trim())
  .refine(
    (val) => {
      if (!val) return true;
      return val.length <= 2048;
    },
    "Google Review URL cannot exceed 2048 characters"
  )
  .refine(
    (val) => {
      if (!val) return true;
      return val.startsWith("https://");
    },
    "Must use secure HTTPS protocol (https://)"
  )
  .refine(
    (val) => {
      if (!val) return true;
      return isValidGoogleUrl(val);
    },
    "Must be a valid Google Review URL (e.g. https://g.page/r/.../review or https://search.google.com/...)"
  )
  .optional()
  .nullable();

export const businessSchema = z.object({
  clientId: z.string().min(1, "Client assignment is required"),
  name: z
    .string()
    .min(2, "Business name must be at least 2 characters")
    .max(120, "Business name cannot exceed 120 characters"),
  googleMapsUrl: googleMapsUrlSchema,
  googleReviewUrl: googleReviewUrlSchema,
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
