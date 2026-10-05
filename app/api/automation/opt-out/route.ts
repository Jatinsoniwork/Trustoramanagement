import { NextRequest, NextResponse } from "next/server";
import { automationService } from "@/server/services/automationService";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS, getClientIp } from "@/lib/security/rateLimit";
import { sanitizeText } from "@/lib/security/sanitization";

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting check
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(clientIp, RATE_LIMITS.OPT_OUT);
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck, "Too many opt-out attempts. Please wait.");
    }

    const body = await request.json();
    const rawToken = body?.token;

    if (!rawToken || typeof rawToken !== "string") {
      return NextResponse.json(
        { success: false, message: "Review request token is required." },
        { status: 400 }
      );
    }

    const cleanToken = sanitizeText(rawToken).slice(0, 128);
    const result = await automationService.optOutCustomer(cleanToken);
    return NextResponse.json(result, { status: result.success ? 200 : 404 });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Opt-out failed.";
    return NextResponse.json({ success: false, message: errMessage }, { status: 500 });
  }
}
