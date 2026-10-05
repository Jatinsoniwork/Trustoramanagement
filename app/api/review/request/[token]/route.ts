import { NextRequest, NextResponse } from "next/server";
import { automationService } from "@/server/services/automationService";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS, getClientIp } from "@/lib/security/rateLimit";
import { sanitizeText } from "@/lib/security/sanitization";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    // 1. Rate limiting check (Enumeration defense: 60 per minute per IP)
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(clientIp, RATE_LIMITS.TOKEN_RESOLVE);
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck, "Too many review link queries. Please slow down.");
    }

    const { token } = await params;
    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { success: false, message: "Token is required." },
        { status: 400 }
      );
    }

    const cleanToken = sanitizeText(token).slice(0, 128);
    const result = await automationService.resolveRequestByToken(cleanToken);
    if (!result.valid) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          reason: result.reason,
          message:
            result.reason === "EXPIRED"
              ? "This review link has expired."
              : result.reason === "CANCELLED"
              ? "This review request has been cancelled."
              : result.reason === "OPTED_OUT"
              ? "You have unsubscribed from review requests."
              : "Review link not found or invalid.",
        },
        { status: result.reason === "NOT_FOUND" ? 404 : 410 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        valid: true,
        request: result.request,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Failed to resolve review link.";
    return NextResponse.json({ success: false, message: errMessage }, { status: 500 });
  }
}
