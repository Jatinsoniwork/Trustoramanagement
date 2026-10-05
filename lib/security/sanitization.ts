/**
 * Security & Input Sanitization (Milestone 6 Hardened)
 *
 * Provides robust sanitization against:
 * - Stored & Reflected Cross-Site Scripting (XSS)
 * - HTML & Script Injection
 * - Prompt Injection into AI review synthesis
 * - URL Protocol Hijacking (javascript:, data:, vbscript:)
 * - Malformed Pagination & Query Parameters
 */

/**
 * Strips HTML tags, script entities, dangerous event handlers, and control characters.
 */
export function sanitizeText(input: string | null | undefined): string {
  if (!input) return "";

  return input
    .trim()
    // Strip null bytes and non-printable control characters (except common whitespace)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Strip HTML opening and closing tag characters
    .replace(/[<>]/g, "")
    // Neutralize script/style tags and attribute event handlers if encoded
    .replace(/javascript\s*:/gi, "")
    .replace(/data\s*:\s*text\/html/gi, "")
    .replace(/onload\s*=/gi, "")
    .replace(/onerror\s*=/gi, "")
    .replace(/onclick\s*=/gi, "");
}

/**
 * Escapes characters for safe rendering in HTML contexts.
 */
export function escapeHtml(str: string): string {
  if (!str) return "";
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return str.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Strictly validates URLs, permitting only http: and https: protocols.
 * Neutralizes javascript:, file:, data:, and relative redirection vectors.
 */
export function sanitizeUrl(input: string | null | undefined): string {
  if (!input) return "";
  const trimmed = input.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
    return "";
  } catch {
    return "";
  }
}

/**
 * Sanitizes and protects user input before feeding into AI prompts.
 * Defends against prompt injection, instruction hijacking, and system override attempts.
 */
export function sanitizePromptInput(input: string | null | undefined, maxLength = 2000): string {
  if (!input) return "";

  let cleaned = sanitizeText(input).slice(0, maxLength);

  // Common prompt injection keywords & delimiters to neutralize
  const injectionPatterns = [
    /ignore (all )?(previous|above) instructions/gi,
    /disregard (all )?(previous|above) instructions/gi,
    /system\s*:/gi,
    /assistant\s*:/gi,
    /human\s*:/gi,
    /role\s*:\s*(system|assistant|admin)/gi,
    /new instructions\s*:/gi,
    /bypass safety/gi,
    /override (the )?system prompt/gi,
  ];

  for (const pattern of injectionPatterns) {
    cleaned = cleaned.replace(pattern, "[filtered-prompt-content]");
  }

  return cleaned.trim();
}

/**
 * Validates and constrains pagination parameters safely.
 * Enforces positive integers and prevents server resource exhaustion.
 */
export function validatePagination(
  rawPage: string | number | null | undefined,
  rawLimit: string | number | null | undefined,
  options: { defaultLimit?: number; maxLimit?: number } = {}
): { page: number; limit: number } {
  const defaultLimit = options.defaultLimit || 10;
  const maxLimit = options.maxLimit || 100;

  let page = typeof rawPage === "number" ? rawPage : parseInt(String(rawPage || "1"), 10);
  if (isNaN(page) || page < 1) page = 1;

  let limit = typeof rawLimit === "number" ? rawLimit : parseInt(String(rawLimit || defaultLimit), 10);
  if (isNaN(limit) || limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;

  return { page, limit };
}
