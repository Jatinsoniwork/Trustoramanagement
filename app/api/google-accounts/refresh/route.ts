import { NextRequest, NextResponse } from "next/server";
import { googleAccountService } from "@/server/services/googleAccountService";
import { validateAdminRequest } from "@/lib/security/auth";

export async function POST(request: NextRequest) {
  // 1. Enforce Server-Side Authorization
  const auth = validateAdminRequest(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error || "Admin authorization required" },
      { status: auth.status }
    );
  }

  try {
    const body = await request.json();
    const { accountId } = body;

    if (!accountId || typeof accountId !== "string") {
      return NextResponse.json(
        { success: false, error: "Invalid account ID." },
        { status: 400 }
      );
    }

    const result = await googleAccountService.refreshToken(accountId);

    return NextResponse.json({
      success: result.success,
      error: result.error,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to perform token refresh.",
      },
      { status: 500 }
    );
  }
}
