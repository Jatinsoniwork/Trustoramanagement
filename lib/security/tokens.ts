import crypto from "crypto";

/**
 * Security: Token redaction and protection policies
 * Enforces our strict rules:
 * 1. Never send tokens to the client
 * 2. Never log tokens in stdout/monitoring
 * 3. Never store raw passwords
 */

export function redactSensitiveObject<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const sensitiveKeys = [
    "accessToken",
    "accessTokenEncrypted",
    "refreshToken",
    "refreshTokenEncrypted",
    "password",
    "secret",
    "apiKey",
    "key",
  ];

  const sanitized = { ...obj };

  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s.toLowerCase()))) {
      delete sanitized[key];
    }
  }

  return sanitized;
}

export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "***@***.***";
  const [local, domain] = email.split("@");
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${local[1]}***${local[local.length - 1]}@${domain}`;
}

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) return "***-***-****";
  const cleaned = phone.trim();
  const last4 = cleaned.slice(-4);
  return `***-***-${last4}`;
}

/**
 * Generates a cryptographically strong, URL-safe random token.
 * Default 24 bytes yields 32 characters in base64url encoding.
 */
export function generateSecureToken(bytes = 24): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

/**
 * Produces a SHA-256 hash of a token for secure hashed storage and comparison.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Compares two strings using constant-time comparison to prevent timing attacks.
 */
export function timingSafeEqualString(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Builds the customer-facing review URL with the secure token.
 */
export function buildReviewUrl(token: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/review/request/${token}`;
}

/**
 * Builds the customer-facing unsubscribe / opt-out URL.
 */
export function buildUnsubscribeUrl(token: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/review/unsubscribe?token=${token}`;
}

/**
 * Checks if a given expiration timestamp is past.
 */
export function isTokenExpired(expiresAt: Date | string | null | undefined): boolean {
  if (!expiresAt) return false;
  const time = new Date(expiresAt).getTime();
  if (isNaN(time)) return false;
  return time < Date.now();
}
