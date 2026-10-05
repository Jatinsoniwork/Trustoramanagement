import { NextRequest, NextResponse } from "next/server";
import { automationService } from "@/server/services/automationService";
import { validateAdminRequest } from "@/lib/security/auth";

export async function GET(request: NextRequest) {
  // 1. Enforce Server-Side Authorization
  const auth = validateAdminRequest(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, message: auth.error || "Admin authorization required" },
      { status: auth.status }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    let businessId = searchParams.get("businessId") || "demo-biz-1";

    // 2. Multi-Tenant Business Isolation Check
    const callerBizId = request.headers.get("x-user-business-id") || auth.user?.businessId;
    if (callerBizId) {
      if (businessId && businessId !== callerBizId) {
        return NextResponse.json(
          {
            success: false,
            message: "Access denied: You cannot view settings for another business.",
          },
          { status: 403 }
        );
      }
      businessId = callerBizId;
    }

    const settings = await automationService.getSettings(businessId);
    return NextResponse.json({ success: true, settings }, { status: 200 });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Failed to load automation settings.";
    return NextResponse.json({ success: false, message: errMessage }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  // 1. Enforce Server-Side Authorization
  const auth = validateAdminRequest(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, message: auth.error || "Admin authorization required" },
      { status: auth.status }
    );
  }

  try {
    const body = await request.json();
    const { businessId, ...updates } = body;

    if (!businessId) {
      return NextResponse.json(
        { success: false, message: "businessId is required." },
        { status: 400 }
      );
    }

    // 2. Multi-Tenant Business Isolation Check
    const callerBizId = request.headers.get("x-user-business-id") || auth.user?.businessId;
    if (callerBizId && businessId !== callerBizId) {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied: You cannot modify settings for another business.",
        },
        { status: 403 }
      );
    }

    // 3. Input Validation Boundaries
    if (updates.maxReminders !== undefined) {
      const maxRem = Number(updates.maxReminders);
      if (isNaN(maxRem) || maxRem < 1 || maxRem > 5) {
        return NextResponse.json(
          { success: false, message: "maxReminders must be between 1 and 5." },
          { status: 400 }
        );
      }
      updates.maxReminders = maxRem;
    }

    if (updates.delayMinutes !== undefined) {
      const delay = Number(updates.delayMinutes);
      if (isNaN(delay) || delay < 0 || delay > 10080) {
        return NextResponse.json(
          { success: false, message: "delayMinutes must be between 0 and 10080 (7 days)." },
          { status: 400 }
        );
      }
      updates.delayMinutes = delay;
    }

    if (updates.channel !== undefined) {
      if (!["EMAIL", "SMS", "BOTH"].includes(updates.channel)) {
        return NextResponse.json(
          { success: false, message: "channel must be EMAIL, SMS, or BOTH." },
          { status: 400 }
        );
      }
    }

    const updated = await automationService.updateSettings(businessId, updates, auth.user?.id);
    return NextResponse.json({ success: true, settings: updated }, { status: 200 });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Failed to update automation settings.";
    return NextResponse.json({ success: false, message: errMessage }, { status: 500 });
  }
}
