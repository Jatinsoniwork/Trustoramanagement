import { NextRequest, NextResponse } from "next/server";
import { googleAccountService } from "@/server/services/googleAccountService";
import { isGoogleOAuthConfigured } from "@/lib/oauth/google";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId") || undefined;
  const loginHint = searchParams.get("loginHint") || undefined;

  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(
      new URL(
        "/google-accounts?error=oauth_not_configured",
        request.url
      )
    );
  }

  try {
    const { authUrl, state } = await googleAccountService.initiateOAuth({
      accountId,
      loginHint,
    });

    const response = NextResponse.redirect(authUrl);

    // Set secure, short-lived HTTP-only cookie for CSRF state validation (10 minutes)
    response.cookies.set("rf_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to initiate OAuth";
    return NextResponse.redirect(
      new URL(
        `/google-accounts?error=${encodeURIComponent(message)}`,
        request.url
      )
    );
  }
}
