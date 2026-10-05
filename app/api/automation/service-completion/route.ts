import { NextRequest, NextResponse } from "next/server";
import { automationService } from "@/server/services/automationService";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS, getClientIp } from "@/lib/security/rateLimit";
import { sanitizeText } from "@/lib/security/sanitization";

export async function POST(request: NextRequest) {
  try {
    // 1. Rate Limiting Check (Abuse prevention for POS / CRM webhooks)
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(clientIp, RATE_LIMITS.SERVICE_COMPLETION);
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck, "Service completion webhook rate limit exceeded.");
    }

    const body = await request.json();
    const {
      businessId,
      serviceId,
      serviceName,
      customerName,
      customerEmail,
      customerPhone,
      channel,
      delayMinutes,
    } = body;

    if (!businessId || typeof businessId !== "string") {
      return NextResponse.json(
        { success: false, message: "Valid businessId is required." },
        { status: 400 }
      );
    }

    const sanitizedName = sanitizeText(customerName);
    if (!sanitizedName || sanitizedName.length < 2 || sanitizedName.length > 100) {
      return NextResponse.json(
        { success: false, message: "customerName must be between 2 and 100 characters." },
        { status: 400 }
      );
    }

    if (!customerEmail?.trim() && !customerPhone?.trim()) {
      return NextResponse.json(
        { success: false, message: "Customer email or phone number is required." },
        { status: 400 }
      );
    }

    let validDelay = 0;
    if (delayMinutes !== undefined) {
      const d = Number(delayMinutes);
      if (!isNaN(d) && d >= 0 && d <= 10080) {
        validDelay = Math.round(d);
      }
    }

    const result = await automationService.triggerServiceCompletion({
      businessId,
      serviceId: serviceId ? sanitizeText(String(serviceId)).slice(0, 100) : `srv-${Date.now()}`,
      serviceName: serviceName ? sanitizeText(String(serviceName)).slice(0, 120) : "General Service",
      customerName: sanitizedName,
      customerEmail: customerEmail ? sanitizeText(customerEmail) : undefined,
      customerPhone: customerPhone ? sanitizeText(customerPhone) : undefined,
      channel: channel === "SMS" ? "SMS" : "EMAIL",
      delayMinutes: validDelay,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Service completion trigger failed.";
    return NextResponse.json({ success: false, message: errMessage }, { status: 500 });
  }
}
