import { NextRequest, NextResponse } from "next/server";
import { automationService } from "@/server/services/automationService";
import { reviewRepository } from "@/server/repositories/reviewRepository";
import { validateAdminRequest } from "@/lib/security/auth";

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

    // 2. Fetch request to check existence and business isolation
    const reqRecord = await reviewRepository.findById(id);
    if (!reqRecord) {
      return NextResponse.json(
        { success: false, message: "Review request not found." },
        { status: 404 }
      );
    }

    // 3. Multi-Tenant Business Isolation Check
    const callerBizId = request.headers.get("x-user-business-id") || auth.user?.businessId;
    if (callerBizId && reqRecord.businessId !== callerBizId) {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied: You cannot cancel a review request belonging to another business.",
        },
        { status: 403 }
      );
    }

    const result = await automationService.cancelRequest(id, auth.user?.id);
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Failed to cancel request.";
    return NextResponse.json({ success: false, message: errMessage }, { status: 400 });
  }
}
