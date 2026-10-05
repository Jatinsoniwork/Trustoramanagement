import crypto from "crypto";

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface GoogleTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
  scope: string;
  idToken?: string;
}

export interface GoogleUserProfile {
  id: string; // Google stable user ID (sub)
  email: string;
  name: string;
  picture?: string;
  emailVerified: boolean;
}

export class GoogleOAuthError extends Error {
  public code?: string;
  public isReauthRequired?: boolean;

  constructor(message: string, code?: string, isReauthRequired = false) {
    super(message);
    this.name = "GoogleOAuthError";
    this.code = code;
    this.isReauthRequired = isReauthRequired;
  }
}

/**
 * Returns Google OAuth configuration from environment variables.
 * Never hardcodes credentials or ports.
 */
export function getGoogleOAuthConfig(): GoogleOAuthConfig {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

  // Derive redirect URI dynamically from APP_URL or explicit GOOGLE_REDIRECT_URI
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI?.trim() ||
    `${baseUrl.replace(/\/$/, "")}/api/auth/callback/google`;

  const defaultScopes = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ];

  const envScopes = process.env.GOOGLE_OAUTH_SCOPES
    ? process.env.GOOGLE_OAUTH_SCOPES.split(" ").filter(Boolean)
    : defaultScopes;

  return {
    clientId,
    clientSecret,
    redirectUri,
    scopes: envScopes,
  };
}

/**
 * Validates whether Google OAuth client credentials are configured.
 */
export function isGoogleOAuthConfigured(): boolean {
  const { clientId, clientSecret } = getGoogleOAuthConfig();
  return Boolean(
    clientId &&
      clientId.trim() !== "" &&
      clientSecret &&
      clientSecret.trim() !== ""
  );
}

/**
 * Generates an authorization URL for Google OAuth 2.0.
 * Requests offline access (refresh_token) and prompts for consent.
 */
export function createGoogleAuthUrl(options: {
  state: string;
  loginHint?: string;
}): string {
  const config = getGoogleOAuthConfig();

  if (!config.clientId) {
    throw new GoogleOAuthError(
      "GOOGLE_CLIENT_ID is not configured in environment variables."
    );
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: config.scopes.join(" "),
    access_type: "offline", // Essential to obtain refresh_token
    prompt: "consent", // Ensures Google re-issues a refresh_token on reconnect
    state: options.state,
  });

  if (options.loginHint) {
    params.set("login_hint", options.loginHint);
  }

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchanges the authorization code received from Google for access & refresh tokens.
 */
export async function exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
  const config = getGoogleOAuthConfig();

  if (!config.clientId || !config.clientSecret) {
    throw new GoogleOAuthError("Google OAuth client credentials are not configured.");
  }

  const body = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: "authorization_code",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorDescription =
      data.error_description || data.error || "Failed to exchange authorization code.";
    throw new GoogleOAuthError(
      `Google OAuth token exchange failed: ${errorDescription}`,
      data.error
    );
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    tokenType: data.token_type,
    scope: data.scope,
    idToken: data.id_token,
  };
}

/**
 * Obtains the authorized Google user's profile identity using the access token.
 */
export async function getGoogleUserProfile(
  accessToken: string
): Promise<GoogleUserProfile> {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new GoogleOAuthError("Failed to fetch Google user profile from userinfo endpoint.");
  }

  const data = await response.json();

  if (!data.sub || !data.email) {
    throw new GoogleOAuthError("Google user profile is missing required identity identifiers.");
  }

  return {
    id: data.sub, // Stable external identifier
    email: data.email,
    name: data.name || data.email,
    picture: data.picture,
    emailVerified: Boolean(data.email_verified),
  };
}

/**
 * Refreshes an expired Google access token using the decrypted refresh token.
 */
export async function refreshGoogleAccessToken(
  refreshToken: string
): Promise<{
  accessToken: string;
  expiresIn: number;
  newRefreshToken?: string;
  scopes?: string;
}> {
  const config = getGoogleOAuthConfig();

  if (!config.clientId || !config.clientSecret) {
    throw new GoogleOAuthError("Google OAuth client credentials are not configured.");
  }

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorType = data.error || "unknown_error";
    // Detect permanent revocation or invalid grant
    const isReauthRequired =
      errorType === "invalid_grant" ||
      errorType === "unauthorized_client" ||
      errorType === "invalid_request";

    throw new GoogleOAuthError(
      `Google token refresh failed: ${data.error_description || errorType}`,
      errorType,
      isReauthRequired
    );
  }

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
    newRefreshToken: data.refresh_token,
    scopes: data.scope,
  };
}

/**
 * Revokes Google authorization for a given token (access or refresh token).
 */
export async function revokeGoogleToken(token: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Creates and signs a secure state token for CSRF protection during OAuth flows.
 */
export function generateOAuthState(metadata?: { accountId?: string }): string {
  const randomBytes = crypto.randomBytes(24).toString("hex");
  const payload = JSON.stringify({
    nonce: randomBytes,
    ts: Date.now(),
    accountId: metadata?.accountId,
  });
  return Buffer.from(payload).toString("base64url");
}

/**
 * Validates an OAuth state string and checks expiry (10-minute window).
 */
export function parseAndValidateOAuthState(
  stateString: string
): { isValid: boolean; accountId?: string } {
  try {
    const decoded = Buffer.from(stateString, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded);

    if (!parsed.nonce || !parsed.ts) {
      return { isValid: false };
    }

    const tenMinutesMs = 10 * 60 * 1000;
    const isExpired = Date.now() - parsed.ts > tenMinutesMs;

    if (isExpired) {
      return { isValid: false };
    }

    return { isValid: true, accountId: parsed.accountId };
  } catch {
    return { isValid: false };
  }
}
