import { NextRequest, NextResponse } from "next/server";
import { automationService } from "@/server/services/automationService";
import { reviewRepository } from "@/server/repositories/reviewRepository";
import { validateAdminRequest } from "@/lib/security/auth";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS, getClientIp } from "@/lib/security/rateLimit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Enforce Server-Side Authorization
  const auth = validateAdminRequest(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, message: auth.error || "Admin authorization required" },
      { status: auth.status }
    );
  }

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Review request ID is required." },
        { status: 400 }
      );
    }

    // 2. Rate Limiting Check
    const rateKey = auth.user?.id || getClientIp(request);
    const rateCheck = checkRateLimit(rateKey, RATE_LIMITS.RESEND);
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck, "Too many resend requests. Please wait before retrying.");
    }

    // 3. Fetch request to check existence and business isolation
    const reqRecord = await reviewRepository.findById(id);
    if (!reqRecord) {
      return NextResponse.json(
        { success: false, message: "Review request not found." },
        { status: 404 }
      );
    }

    // 4. Multi-Tenant Business Isolation Check
    const callerBizId = request.headers.get("x-user-business-id") || auth.user?.businessId;
    if (callerBizId && reqRecord.businessId !== callerBizId) {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied: You cannot resend a notification for another business.",
        },
        { status: 403 }
      );
    }

    const result = await automationService.resendNotification(id, auth.user?.id);
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Failed to resend notification.";
    const isCooldown = errMessage.includes("wait") || errMessage.includes("cooldown");
    return NextResponse.json(
      { success: false, message: errMessage },
      { status: isCooldown ? 429 : 400 }
    );
  }
}
