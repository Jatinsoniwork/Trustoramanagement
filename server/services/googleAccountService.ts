import { googleAccountRepository } from "@/server/repositories/googleAccountRepository";
import { activityRepository } from "@/server/repositories/activityRepository";
import {
  createGoogleAuthUrl,
  exchangeCodeForTokens,
  getGoogleUserProfile,
  refreshGoogleAccessToken,
  revokeGoogleToken,
  generateOAuthState,
  parseAndValidateOAuthState,
  isGoogleOAuthConfigured,
  GoogleOAuthError,
} from "@/lib/oauth/google";
import { encryptSecret, decryptSecret } from "@/lib/security/encryption";
import { GoogleAccount, GoogleAccountStatus } from "@/types";

export const googleAccountService = {
  /**
   * Retrieves all Google accounts with safe projections.
   */
  async getAccounts(query?: { status?: GoogleAccountStatus }): Promise<GoogleAccount[]> {
    return googleAccountRepository.findAll(query);
  },

  /**
   * Retrieves a single Google account by ID.
   */
  async getAccountById(id: string): Promise<GoogleAccount | null> {
    return googleAccountRepository.findById(id);
  },

  /**
   * Starts the Google OAuth 2.0 flow:
   * Generates a secure CSRF state token and builds the official Google consent URL.
   */
  async initiateOAuth(options?: { accountId?: string; loginHint?: string }): Promise<{
    authUrl: string;
    state: string;
  }> {
    if (!isGoogleOAuthConfigured()) {
      throw new GoogleOAuthError(
        "Google OAuth credentials (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) are not configured."
      );
    }

    const state = generateOAuthState({ accountId: options?.accountId });
    const authUrl = createGoogleAuthUrl({
      state,
      loginHint: options?.loginHint,
    });

    return { authUrl, state };
  },

  /**
   * Processes the OAuth 2.0 callback:
   * 1. Validates CSRF state and matches against secure cookie
   * 2. Exchanges code for tokens server-side
   * 3. Fetches user profile identity
   * 4. Encrypts sensitive tokens with AES-256-GCM
   * 5. Upserts GoogleAccount record preventing duplicates
   * 6. Writes immutable audit log
   */
  async handleCallback(params: {
    code: string;
    state: string;
    storedStateCookie?: string;
    actorId?: string;
  }): Promise<{ account: GoogleAccount; isReconnect: boolean }> {
    // 1. Validate CSRF state
    const stateValidation = parseAndValidateOAuthState(params.state);
    if (!stateValidation.isValid) {
      throw new GoogleOAuthError("Invalid or expired OAuth state parameter.", "invalid_state");
    }

    if (params.storedStateCookie && params.storedStateCookie !== params.state) {
      throw new GoogleOAuthError(
        "OAuth state does not match the session challenge cookie.",
        "state_mismatch"
      );
    }

    // 2. Exchange authorization code for tokens
    const tokens = await exchangeCodeForTokens(params.code);

    // 3. Fetch user profile identity
    const profile = await getGoogleUserProfile(tokens.accessToken);

    // 4. Encrypt sensitive tokens at rest with AES-256-GCM
    const encryptedAccessToken = encryptSecret(tokens.accessToken);
    const encryptedRefreshToken = tokens.refreshToken
      ? encryptSecret(tokens.refreshToken)
      : null;

    const tokenExpiresAt = new Date(Date.now() + tokens.expiresIn * 1000);

    // 5. Check if this account was previously registered to determine action type
    const existing = await googleAccountRepository.findByGoogleUserId(profile.id);
    const isReconnect = Boolean(existing);

    // 6. Upsert the account in database (updates existing, prevents duplicates)
    const account = await googleAccountRepository.upsertAuthorizedAccount({
      googleUserId: profile.id,
      email: profile.email,
      displayName: profile.name,
      profileImageUrl: profile.picture,
      encryptedAccessToken,
      encryptedRefreshToken,
      tokenExpiresAt,
      scopes: tokens.scope,
    });

    // 7. Write immutable audit log
    await activityRepository.log({
      actorId: params.actorId,
      action: isReconnect
        ? "GOOGLE_ACCOUNT_RECONNECTED"
        : "GOOGLE_ACCOUNT_CONNECTED",
      entityType: "GoogleAccount",
      entityId: account.id,
      metadata: {
        email: account.email,
        displayName: account.displayName,
        googleUserId: account.googleUserId,
        isReconnect,
      },
    });

    return { account, isReconnect };
  },

  /**
   * Refreshes an expired access token server-side using the encrypted refresh token.
   * If authorization was revoked by Google or expired, marks account REAUTH_REQUIRED.
   */
  async refreshToken(id: string, actorId?: string): Promise<{ success: boolean; error?: string }> {
    const account = await googleAccountRepository.findById(id);
    if (!account) {
      throw new GoogleOAuthError("Account not found.", "not_found");
    }

    const encryptedCredentials = await googleAccountRepository.getEncryptedTokens(id);
    if (!encryptedCredentials?.refreshTokenEncrypted) {
      await googleAccountRepository.updateStatus(id, "REAUTH_REQUIRED");
      await activityRepository.log({
        actorId,
        action: "GOOGLE_ACCOUNT_REAUTH_REQUIRED",
        entityType: "GoogleAccount",
        entityId: id,
        metadata: { reason: "Missing refresh token" },
      });
      return { success: false, error: "No refresh token available. Re-authorization required." };
    }

    try {
      // 1. Decrypt refresh token server-side
      const plainRefreshToken = decryptSecret(
        encryptedCredentials.refreshTokenEncrypted
      );

      // 2. Request new access token from Google
      const refreshed = await refreshGoogleAccessToken(plainRefreshToken);

      // 3. Encrypt new access token
      const encryptedAccessToken = encryptSecret(refreshed.accessToken);
      const encryptedNewRefreshToken = refreshed.newRefreshToken
        ? encryptSecret(refreshed.newRefreshToken)
        : undefined;

      const tokenExpiresAt = new Date(Date.now() + refreshed.expiresIn * 1000);

      // 4. Update database record
      await googleAccountRepository.updateRefreshedTokens(id, {
        encryptedAccessToken,
        tokenExpiresAt,
        encryptedRefreshToken: encryptedNewRefreshToken,
      });

      return { success: true };
    } catch (err) {
      const isReauth = err instanceof GoogleOAuthError && err.isReauthRequired;
      const statusToSet: GoogleAccountStatus = isReauth ? "REAUTH_REQUIRED" : "ERROR";

      await googleAccountRepository.updateStatus(id, statusToSet);

      await activityRepository.log({
        actorId,
        action: isReauth
          ? "GOOGLE_ACCOUNT_REAUTH_REQUIRED"
          : "GOOGLE_ACCOUNT_REFRESH_FAILED",
        entityType: "GoogleAccount",
        entityId: id,
        metadata: {
          error: err instanceof Error ? err.message : "Token refresh failed",
        },
      });

      return {
        success: false,
        error: isReauth
          ? "Google authorization has been revoked or expired. Re-authorization is required."
          : "Temporary token refresh error occurred.",
      };
    }
  },

  /**
   * Securely disconnects an authorized Google account:
   * 1. Attempts to revoke token at Google
   * 2. Zeroes out stored encrypted credentials in database
   * 3. Sets status to DISCONNECTED
   * 4. Logs audit event
   */
  async disconnectAccount(id: string, actorId?: string): Promise<boolean> {
    const account = await googleAccountRepository.findById(id);
    if (!account) return false;

    // Retrieve encrypted tokens to attempt revocation
    const tokens = await googleAccountRepository.getEncryptedTokens(id);
    if (tokens?.refreshTokenEncrypted) {
      try {
        const plainRefresh = decryptSecret(tokens.refreshTokenEncrypted);
        await revokeGoogleToken(plainRefresh);
      } catch {
        // Continue even if Google revocation fails so database tokens are cleared
      }
    } else if (tokens?.accessTokenEncrypted) {
      try {
        const plainAccess = decryptSecret(tokens.accessTokenEncrypted);
        await revokeGoogleToken(plainAccess);
      } catch {
        // Continue
      }
    }

    // Zero out stored tokens and mark status DISCONNECTED
    const success = await googleAccountRepository.disconnect(id);

    if (success) {
      await activityRepository.log({
        actorId,
        action: "GOOGLE_ACCOUNT_DISCONNECTED",
        entityType: "GoogleAccount",
        entityId: id,
        metadata: {
          email: account.email,
          displayName: account.displayName,
        },
      });
    }

    return success;
  },

  /**
   * Checks current integration status for Google OAuth.
   */
  async getOAuthIntegrationStatus(): Promise<{
    configured: boolean;
    hasClientId: boolean;
    hasClientSecret: boolean;
    hasEncryptionKey: boolean;
    redirectUri: string;
  }> {
    const hasClientId = Boolean(process.env.GOOGLE_CLIENT_ID?.trim());
    const hasClientSecret = Boolean(process.env.GOOGLE_CLIENT_SECRET?.trim());
    const hasEncryptionKey = Boolean(
      (process.env.TOKEN_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY)?.trim()
    );

    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ||
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/callback/google`;

    return {
      configured: hasClientId && hasClientSecret && hasEncryptionKey,
      hasClientId,
      hasClientSecret,
      hasEncryptionKey,
      redirectUri,
    };
  },
};
