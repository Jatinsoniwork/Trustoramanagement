import { NextRequest, NextResponse } from "next/server";
import { automationService } from "@/server/services/automationService";
import { validateAdminRequest } from "@/lib/security/auth";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS, getClientIp } from "@/lib/security/rateLimit";
import { sanitizeText } from "@/lib/security/sanitization";

export async function POST(request: NextRequest) {
  // 1. Enforce Server-Side Authorization
  const auth = validateAdminRequest(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, message: auth.error || "Admin authorization required" },
      { status: auth.status }
    );
  }

  try {
    // 2. Rate Limiting Check
    const rateKey = auth.user?.id || getClientIp(request);
    const rateCheck = checkRateLimit(rateKey, RATE_LIMITS.MANUAL_REQUEST);
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck, "Too many request creations. Please wait a moment.");
    }

    const body = await request.json();
    const {
      businessId,
      customerName,
      customerEmail,
      customerPhone,
      channel,
      serviceName,
      initialExperience,
      initialRating,
      sendImmediately,
    } = body;

    if (!businessId) {
      return NextResponse.json(
        { success: false, message: "businessId is required." },
        { status: 400 }
      );
    }

    // 3. Multi-Tenant Business Isolation Check
    const callerBizId = request.headers.get("x-user-business-id") || auth.user?.businessId;
    if (callerBizId && businessId !== callerBizId) {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied: You cannot create a review request for another business.",
        },
        { status: 403 }
      );
    }

    const sanitizedName = sanitizeText(customerName);
    if (!sanitizedName || sanitizedName.length < 2 || sanitizedName.length > 100) {
      return NextResponse.json(
        { success: false, message: "customerName must be between 2 and 100 characters." },
        { status: 400 }
      );
    }

    const chosenChannel = channel === "SMS" ? "SMS" : "EMAIL";
    if (chosenChannel === "EMAIL" && (!customerEmail?.trim() || !customerEmail.includes("@"))) {
      return NextResponse.json(
        { success: false, message: "A valid email address is required for email notifications." },
        { status: 400 }
      );
    }
    if (chosenChannel === "SMS" && (!customerPhone?.trim() || customerPhone.length < 7)) {
      return NextResponse.json(
        { success: false, message: "A valid phone number is required for SMS notifications." },
        { status: 400 }
      );
    }

    let parsedRating = 5;
    if (initialRating !== undefined) {
      const r = Number(initialRating);
      if (!isNaN(r) && r >= 1 && r <= 5) {
        parsedRating = Math.round(r);
      }
    }

    const result = await automationService.createManualRequest(
      {
        businessId,
        customerName: sanitizedName,
        customerEmail: customerEmail ? sanitizeText(customerEmail) : undefined,
        customerPhone: customerPhone ? sanitizeText(customerPhone) : undefined,
        channel: chosenChannel,
        serviceName: serviceName ? sanitizeText(serviceName) : undefined,
        initialExperience: initialExperience ? sanitizeText(initialExperience) : undefined,
        initialRating: parsedRating,
        sendImmediately,
      },
      auth.user?.id
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Failed to create review request.";
    return NextResponse.json({ success: false, message: errMessage }, { status: 500 });
  }
}
