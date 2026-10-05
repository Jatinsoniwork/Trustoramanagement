import { NextRequest, NextResponse } from "next/server";
import { googleAccountService } from "@/server/services/googleAccountService";
import { validateAdminRequest } from "@/lib/security/auth";

export async function GET(request: NextRequest) {
  // 1. Enforce Server-Side Authorization
  const auth = validateAdminRequest(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error || "Admin authorization required" },
      { status: auth.status }
    );
  }

  try {
    const accounts = await googleAccountService.getAccounts();
    // Return safe account projection (zero tokens)
    return NextResponse.json({ success: true, accounts });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to retrieve Google accounts." },
      { status: 500 }
    );
  }
}
