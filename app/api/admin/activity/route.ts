import { NextRequest, NextResponse } from "next/server";
import { analyticsService } from "@/server/services/analyticsService";
import { validateAdminRequest } from "@/lib/security/auth";

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

    const limitStr = searchParams.get("limit");
    let limit = limitStr ? parseInt(limitStr, 10) : 20;
    if (isNaN(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100;

    const data = await analyticsService.getActivity({
      businessId,
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
