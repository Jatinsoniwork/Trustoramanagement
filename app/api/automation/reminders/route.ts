import { NextRequest, NextResponse } from "next/server";
import { automationService } from "@/server/services/automationService";
import { validateAdminRequest } from "@/lib/security/auth";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS, getClientIp } from "@/lib/security/rateLimit";

export async function POST(request: NextRequest) {
  // 1. Authorization: either Admin session/bearer token or valid CRON_SECRET header
  const cronSecret = request.headers.get("x-cron-secret");
  const expectedCronSecret = process.env.CRON_SECRET;
  const isAuthorizedCron = expectedCronSecret && cronSecret === expectedCronSecret;

  let authUser = null;
  if (!isAuthorizedCron) {
    const auth = validateAdminRequest(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, message: auth.error || "Authorization required to trigger reminders." },
        { status: auth.status }
      );
    }
    authUser = auth.user;
  }

  // 2. Rate Limiting Check
  const rateKey = authUser?.id || getClientIp(request);
  const rateCheck = checkRateLimit(rateKey, RATE_LIMITS.REMINDERS);
  if (!rateCheck.allowed) {
    return rateLimitResponse(rateCheck, "Reminder processor triggered too frequently.");
  }

  try {
    let businessId: string | undefined = undefined;
    let forceEligible = false;

    try {
      const body = await request.json();
      businessId = body?.businessId;
      forceEligible = Boolean(body?.forceEligible);
    } catch {
      // Body is optional
    }

    // 3. Multi-Tenant Business Isolation Check
    const callerBizId = request.headers.get("x-user-business-id") || authUser?.businessId;
    if (callerBizId) {
      if (businessId && businessId !== callerBizId) {
        return NextResponse.json(
          { success: false, message: "Access denied: Cannot process reminders for another business." },
          { status: 403 }
        );
      }
      businessId = callerBizId;
    }

    const result = await automationService.processReminders({
      businessId,
      forceEligible,
    });

    return NextResponse.json({ success: true, ...result }, { status: 200 });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Failed to run reminder process.";
    return NextResponse.json({ success: false, message: errMessage }, { status: 500 });
  }
}
