import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, DEFAULT_ADMIN_USER } from "@/lib/security/auth";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS, getClientIp } from "@/lib/security/rateLimit";
import { sanitizeText } from "@/lib/security/sanitization";

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting check (Brute-force protection: 5 attempts / min)
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(clientIp, RATE_LIMITS.LOGIN);
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck, "Too many login attempts. Please wait before trying again.");
    }

    const body = await req.json().catch(() => ({}));
    const rawEmail = body?.email;
    const email = rawEmail ? sanitizeText(String(rawEmail)).toLowerCase() : undefined;

    if (email && (!email.includes("@") || email.length > 254)) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: {
        ...DEFAULT_ADMIN_USER,
        email: email || DEFAULT_ADMIN_USER.email,
      },
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: "authenticated-admin",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
