/**
 * Production In-Memory Rate Limiter & Abuse Prevention Engine
 *
 * Implements a sliding-window counter algorithm with automatic memory cleanup.
 * Protects against brute-force attacks, AI quota exhaustion, and notification spam.
 */

import { NextResponse } from "next/server";

export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  identifier?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

interface WindowBucket {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, WindowBucket>();

// Periodic cleanup of expired rate-limit buckets every 5 minutes to prevent memory leaks
let lastCleanup = Date.now();
function cleanupExpiredBuckets() {
  const now = Date.now();
  if (now - lastCleanup > 5 * 60 * 1000) {
    lastCleanup = now;
    for (const [key, bucket] of rateLimitStore.entries()) {
      if (bucket.resetAt <= now) {
        rateLimitStore.delete(key);
      }
    }
  }
}

/**
 * Checks and updates rate-limit usage for a specific key.
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  cleanupExpiredBuckets();

  const now = Date.now();
  const bucketKey = options.identifier ? `${options.identifier}:${key}` : key;
  const existing = rateLimitStore.get(bucketKey);

  if (!existing || existing.resetAt <= now) {
    const newBucket: WindowBucket = {
      count: 1,
      resetAt: now + options.windowMs,
    };
    rateLimitStore.set(bucketKey, newBucket);

    return {
      allowed: true,
      limit: options.maxRequests,
      remaining: Math.max(0, options.maxRequests - 1),
      resetAt: newBucket.resetAt,
      retryAfterSeconds: 0,
    };
  }

  if (existing.count >= options.maxRequests) {
    const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return {
      allowed: false,
      limit: options.maxRequests,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterSeconds: retryAfter,
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    limit: options.maxRequests,
    remaining: Math.max(0, options.maxRequests - existing.count),
    resetAt: existing.resetAt,
    retryAfterSeconds: 0,
  };
}

/**
 * Generates an HTTP 429 Too Many Requests response with standard rate-limit headers.
 */
export function rateLimitResponse(result: RateLimitResult, customMessage?: string): NextResponse {
  const message =
    customMessage ||
    `Too many requests. Please slow down and try again in ${result.retryAfterSeconds} seconds.`;

  return NextResponse.json(
    {
      success: false,
      error: message,
      message,
      retryAfter: result.retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": result.retryAfterSeconds.toString(),
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": Math.ceil(result.resetAt / 1000).toString(),
      },
    }
  );
}

/**
 * Standard Production Rate Limits Configuration
 */
export const RATE_LIMITS = {
  // Admin login: 5 attempts per 60 seconds
  LOGIN: { maxRequests: 5, windowMs: 60 * 1000, identifier: "login" },

  // AI Review generation: 15 calls per 60 seconds per IP
  AI_GENERATE: { maxRequests: 15, windowMs: 60 * 1000, identifier: "ai-gen" },

  // POS / CRM Service completion webhook: 60 events per 60 seconds
  SERVICE_COMPLETION: { maxRequests: 60, windowMs: 60 * 1000, identifier: "svc-comp" },

  // Admin Manual Review creation: 30 requests per 60 seconds
  MANUAL_REQUEST: { maxRequests: 30, windowMs: 60 * 1000, identifier: "man-req" },

  // Notification resend: 5 attempts per 10 minutes
  RESEND: { maxRequests: 5, windowMs: 10 * 60 * 1000, identifier: "resend" },

  // Token resolution (customer landing page): 60 views per 60 seconds
  TOKEN_RESOLVE: { maxRequests: 60, windowMs: 60 * 1000, identifier: "tok-res" },

  // Customer opt-out: 10 requests per 60 seconds
  OPT_OUT: { maxRequests: 10, windowMs: 60 * 1000, identifier: "opt-out" },

  // Reminder batch trigger: 10 requests per 60 seconds
  REMINDERS: { maxRequests: 10, windowMs: 60 * 1000, identifier: "reminders" },
};

/**
 * Extracts a dependable client identifier from Next.js request headers.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}
