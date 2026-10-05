import { z } from "zod";

export const clientSchema = z.object({
  name: z
    .string()
    .min(2, "Client organization name must be at least 2 characters")
    .max(100, "Client name cannot exceed 100 characters"),
  contactName: z
    .string()
    .min(2, "Primary contact name is required")
    .max(100, "Contact name cannot exceed 100 characters"),
  email: z
    .string()
    .email("A valid email address is required")
    .max(120, "Email cannot exceed 120 characters"),
  phone: z
    .string()
    .min(7, "Phone number must be at least 7 characters")
    .max(30, "Phone number cannot exceed 30 characters"),
  notes: z.string().max(1000, "Notes cannot exceed 1000 characters").optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export type ClientInput = z.infer<typeof clientSchema>;
