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

    const success = await googleAccountService.disconnectAccount(accountId);

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Account could not be found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Account disconnected and credentials removed.",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to disconnect Google account." },
      { status: 500 }
    );
  }
}
