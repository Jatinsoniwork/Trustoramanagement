import { NextRequest, NextResponse } from "next/server";
import { reviewService } from "@/server/services/reviewService";
import { reviewRequestSchema } from "@/lib/validation/review.schema";
import { validateAdminRequest } from "@/lib/security/auth";
import { ReviewRequestStatus } from "@/types";

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

    const statusParam = searchParams.get("status");
    const status = statusParam ? (statusParam as ReviewRequestStatus) : undefined;
    const ratingStr = searchParams.get("rating");
    const rating = ratingStr ? parseInt(ratingStr, 10) : undefined;
    const language = searchParams.get("language") || undefined;

    const requests = await reviewService.getReviewRequests({
      businessId,
      status,
      rating,
      language,
    });

    return NextResponse.json({ success: true, data: requests });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // 1. Enforce Server-Side Authorization
  const auth = validateAdminRequest(req);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error || "Admin authorization required" },
      { status: auth.status }
    );
  }

  try {
    const body = await req.json();
    const validated = reviewRequestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validated.error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    // Enforce business isolation on creation
    if (auth.user?.businessId && validated.data.businessId !== auth.user.businessId) {
      return NextResponse.json(
        { success: false, error: "Access denied: Cannot create request for another business." },
        { status: 403 }
      );
    }

    const created = await reviewService.createReviewRequest(validated.data, auth.user?.id);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
