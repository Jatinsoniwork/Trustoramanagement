import { NextRequest, NextResponse } from "next/server";
import { analyticsService } from "@/server/services/analyticsService";
import { validateAdminRequest } from "@/lib/security/auth";
import { AdminReviewFilters } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // 1. Enforce Server-Side Authorization
  const auth = validateAdminRequest(req);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error || "Admin authorization required" },
      { status: auth.status }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    let businessId = searchParams.get("businessId") || undefined;

    // Enforce business isolation if user is scoped
    if (auth.user?.businessId) {
      if (businessId && businessId !== auth.user.businessId) {
        return NextResponse.json(
          { success: false, error: "Access denied: Tenant isolation violation." },
          { status: 403 }
        );
      }
      businessId = auth.user.businessId;
    }

    const dateRange =
      (searchParams.get("dateRange") as AdminReviewFilters["dateRange"]) || "all";

    const data = await analyticsService.getAnalytics({
      businessId,
      dateRange,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
