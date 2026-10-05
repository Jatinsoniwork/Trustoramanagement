import { NextRequest, NextResponse } from "next/server";
import { analyticsService } from "@/server/services/analyticsService";
import { validateAdminRequest } from "@/lib/security/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Enforce Server-Side Authorization
  const auth = validateAdminRequest(req);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error || "Admin authorization required" },
      { status: auth.status }
    );
  }

  try {
    const { id } = await params;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ success: false, error: "Invalid review ID" }, { status: 400 });
    }

    const review = await analyticsService.getReviewDetail(id);

    if (!review) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 }
      );
    }

    // 2. Enforce Multi-Business Data Isolation
    // Check if caller is scoped to a business or provided businessId in query
    const requestedBusinessId =
      req.nextUrl.searchParams.get("businessId") ||
      req.headers.get("x-user-business-id") ||
      auth.user?.businessId;

    if (requestedBusinessId && review.businessId !== requestedBusinessId) {
      return NextResponse.json(
        {
          success: false,
          error: "Access denied: Review belongs to another business (tenant isolation violation).",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: review,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
