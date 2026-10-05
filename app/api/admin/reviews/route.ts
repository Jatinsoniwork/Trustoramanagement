import { NextRequest, NextResponse } from "next/server";
import { analyticsService } from "@/server/services/analyticsService";
import { validateAdminRequest } from "@/lib/security/auth";
import { validatePagination, sanitizeText } from "@/lib/security/sanitization";
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

    // Enforce business isolation if user is scoped
    let businessId = searchParams.get("businessId") || undefined;
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
    const ratingStr = searchParams.get("rating");
    let rating: number | undefined = undefined;
    if (ratingStr) {
      const parsed = parseInt(ratingStr, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 5) {
        rating = parsed;
      }
    }

    const status = searchParams.get("status") || undefined;
    const rawSearch = searchParams.get("search") || undefined;
    const search = rawSearch ? sanitizeText(rawSearch) : undefined;

    // Constrain and validate pagination safely
    const { page, limit } = validatePagination(
      searchParams.get("page"),
      searchParams.get("limit"),
      { defaultLimit: 10, maxLimit: 100 }
    );

    const data = await analyticsService.getReviews({
      businessId,
      dateRange,
      rating,
      status,
      search,
      page,
      limit,
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
