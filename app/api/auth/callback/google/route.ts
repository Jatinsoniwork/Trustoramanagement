import { NextRequest, NextResponse } from "next/server";
import { googleAccountService } from "@/server/services/googleAccountService";
import { GoogleOAuthError } from "@/lib/oauth/google";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  // Handle user cancellation or Google-returned errors
  if (oauthError) {
    const response = NextResponse.redirect(
      new URL(
        `/google-accounts?error=${encodeURIComponent(
          oauthError === "access_denied"
            ? "Google account authorization was cancelled."
            : `Google returned an authorization error: ${oauthError}`
        )}`,
        request.url
      )
    );
    response.cookies.delete("rf_oauth_state");
    return response;
  }

  // Validate callback parameters
  if (!code || !state) {
    return NextResponse.redirect(
      new URL(
        "/google-accounts?error=missing_callback_parameters",
        request.url
      )
    );
  }

  const storedStateCookie = request.cookies.get("rf_oauth_state")?.value;

  try {
    const { isReconnect } = await googleAccountService.handleCallback({
      code,
      state,
      storedStateCookie,
    });

    const successMessage = isReconnect
      ? "Google account re-authorized successfully."
      : "Google account connected successfully.";

    const response = NextResponse.redirect(
      new URL(
        `/google-accounts?success=${encodeURIComponent(successMessage)}`,
        request.url
      )
    );

    // Clear state challenge cookie
    response.cookies.delete("rf_oauth_state");
    return response;
  } catch (error) {
    let errorMessage = "An error occurred during Google authorization.";

    if (error instanceof GoogleOAuthError) {
      errorMessage = error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    const response = NextResponse.redirect(
      new URL(
        `/google-accounts?error=${encodeURIComponent(errorMessage)}`,
        request.url
      )
    );
    response.cookies.delete("rf_oauth_state");
    return response;
  }
}
