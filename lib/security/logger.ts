/**
 * Production Secure Logging & Error Formatting Utility
 *
 * Enforces sanitization of diagnostic logs to prevent accidental exposure of
 * secrets, passwords, encryption keys, tokens, and raw customer PII.
 */

import { maskEmail, maskPhone } from "./tokens";

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogPayload {
  message: string;
  context?: Record<string, unknown>;
  error?: unknown;
}

/**
 * Sanitizes arbitrary values to redact credentials and mask PII.
 */
export function sanitizeLogValue(val: unknown): unknown {
  if (typeof val === "string") {
    // Redact password or key-like string values
    if (/^[0-9a-f]{32,64}$/i.test(val)) {
      return "[REDACTED_SECRET]";
    }
    if (val.includes("@")) {
      return maskEmail(val);
    }
    if (/^\+?[0-9]{10,15}$/.test(val)) {
      return maskPhone(val);
    }
    return val;
  }

  if (Array.isArray(val)) {
    return val.map((item) => sanitizeLogValue(item));
  }

  if (val !== null && typeof val === "object") {
    const sensitiveKeys = [
      "token",
      "secret",
      "password",
      "key",
      "apikey",
      "auth",
      "credential",
    ];
    const sanitizedObj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      if (sensitiveKeys.some((s) => k.toLowerCase().includes(s))) {
        sanitizedObj[k] = "[REDACTED_SECRET]";
      } else {
        sanitizedObj[k] = sanitizeLogValue(v);
      }
    }
    return sanitizedObj;
  }

  return val;
}

export const logger = {
  info(message: string, context?: Record<string, unknown>) {
    const safeContext = context ? sanitizeLogValue(context) : undefined;
    if (safeContext) {
      console.log(`[INFO] ${message}`, safeContext);
    } else {
      console.log(`[INFO] ${message}`);
    }
  },

  warn(message: string, context?: Record<string, unknown>) {
    const safeContext = context ? sanitizeLogValue(context) : undefined;
    if (safeContext) {
      console.warn(`[WARN] ${message}`, safeContext);
    } else {
      console.warn(`[WARN] ${message}`);
    }
  },

  error(message: string, error?: unknown, context?: Record<string, unknown>) {
    const safeContext = context ? sanitizeLogValue(context) : undefined;
    const safeError =
      error instanceof Error
        ? { message: error.message, name: error.name }
        : typeof error === "string"
        ? error
        : undefined;

    console.error(`[ERROR] ${message}`, { error: safeError, context: safeContext });
  },
};

/**
 * Safe API Error response formatter.
 * Ensures stack traces and database credentials are never leaked to external clients.
 */
export function formatApiError(error: unknown, fallbackMessage = "An internal error occurred."): {
  status: number;
  message: string;
} {
  if (error instanceof Error) {
    const msg = error.message;

    // Filter out Prisma or database connectivity strings
    if (msg.includes("prisma") || msg.includes("postgres") || msg.includes("DATABASE_URL")) {
      return { status: 500, message: "A database error occurred. Please try again shortly." };
    }

    // Rate limiting
    if (msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("cooldown")) {
      return { status: 429, message: msg };
    }

    // Not found
    if (msg.toLowerCase().includes("not found")) {
      return { status: 404, message: msg };
    }

    // Permission / Authorization
    if (msg.toLowerCase().includes("denied") || msg.toLowerCase().includes("forbidden") || msg.toLowerCase().includes("unauthorized")) {
      return { status: 403, message: msg };
    }

    return { status: 400, message: msg };
  }

  return { status: 500, message: fallbackMessage };
}
