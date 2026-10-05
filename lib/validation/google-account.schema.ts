import { z } from "zod";

export const googleAccountSchema = z.object({
  email: z.string().email("A valid Google account email is required"),
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
  googleUserId: z.string().optional().nullable(),
  profileImageUrl: z.string().url().optional().nullable(),
  status: z
    .enum(["CONNECTED", "DISCONNECTED", "REVOKED", "EXPIRED"])
    .default("DISCONNECTED"),
});

export type GoogleAccountInput = z.infer<typeof googleAccountSchema>;
