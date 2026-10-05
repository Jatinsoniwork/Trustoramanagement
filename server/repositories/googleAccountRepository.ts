import { prisma, isDatabaseConfigured } from "@/lib/db/prisma";
import { GoogleAccount, GoogleAccountStatus } from "@/types";

export interface UpsertGoogleAccountData {
  googleUserId: string;
  email: string;
  displayName: string;
  profileImageUrl?: string | null;
  encryptedAccessToken: string;
  encryptedRefreshToken?: string | null;
  tokenExpiresAt: Date;
  scopes: string;
}

export const googleAccountRepository = {
  /**
   * Retrieves all accounts with safe projection.
   * Access tokens and refresh tokens are strictly omitted from results.
   */
  async findAll(query?: { status?: GoogleAccountStatus }): Promise<GoogleAccount[]> {
    if (!isDatabaseConfigured()) {
      return [];
    }
    try {
      const accounts = await prisma.googleAccount.findMany({
        where: query?.status ? { status: query.status } : undefined,
        select: {
          id: true,
          email: true,
          displayName: true,
          googleUserId: true,
          profileImageUrl: true,
          scopes: true,
          status: true,
          tokenExpiresAt: true,
          lastConnectedAt: true,
          createdAt: true,
          updatedAt: true,
          // Explicitly OMIT accessTokenEncrypted and refreshTokenEncrypted!
        },
        orderBy: { createdAt: "desc" },
      });
      return accounts as unknown as GoogleAccount[];
    } catch (error) {
      console.error("Error finding Google accounts from database:", error);
      return [];
    }
  },

  /**
   * Finds an account by ID with safe projection.
   */
  async findById(id: string): Promise<GoogleAccount | null> {
    if (!isDatabaseConfigured()) {
      return null;
    }
    try {
      const account = await prisma.googleAccount.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          displayName: true,
          googleUserId: true,
          profileImageUrl: true,
          scopes: true,
          status: true,
          tokenExpiresAt: true,
          lastConnectedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return (account as unknown as GoogleAccount) || null;
    } catch (error) {
      console.error(`Error finding Google account ${id}:`, error);
      return null;
    }
  },

  /**
   * Finds an account by stable Google User ID (sub).
   */
  async findByGoogleUserId(googleUserId: string): Promise<GoogleAccount | null> {
    if (!isDatabaseConfigured()) {
      return null;
    }
    try {
      const account = await prisma.googleAccount.findUnique({
        where: { googleUserId },
        select: {
          id: true,
          email: true,
          displayName: true,
          googleUserId: true,
          profileImageUrl: true,
          scopes: true,
          status: true,
          tokenExpiresAt: true,
          lastConnectedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return (account as unknown as GoogleAccount) || null;
    } catch (error) {
      console.error(`Error finding Google account by googleUserId:`, error);
      return null;
    }
  },

  /**
   * Securely upserts an authorized Google account.
   * If an account with this googleUserId or email already exists, updates it without creating duplicates.
   */
  async upsertAuthorizedAccount(data: UpsertGoogleAccountData): Promise<GoogleAccount> {
    const now = new Date();

    try {
      const existing = await prisma.googleAccount.findFirst({
        where: {
          OR: [{ googleUserId: data.googleUserId }, { email: data.email }],
        },
      });

      if (existing) {
        const updated = await prisma.googleAccount.update({
          where: { id: existing.id },
          data: {
            googleUserId: data.googleUserId,
            email: data.email,
            displayName: data.displayName,
            profileImageUrl: data.profileImageUrl ?? existing.profileImageUrl,
            accessTokenEncrypted: data.encryptedAccessToken,
            refreshTokenEncrypted:
              data.encryptedRefreshToken ?? existing.refreshTokenEncrypted,
            tokenExpiresAt: data.tokenExpiresAt,
            scopes: data.scopes,
            status: "CONNECTED",
            lastConnectedAt: now,
          },
          select: {
            id: true,
            email: true,
            displayName: true,
            googleUserId: true,
            profileImageUrl: true,
            scopes: true,
            status: true,
            tokenExpiresAt: true,
            lastConnectedAt: true,
            createdAt: true,
            updatedAt: true,
          },
        });
        return updated as unknown as GoogleAccount;
      }

      const created = await prisma.googleAccount.create({
        data: {
          googleUserId: data.googleUserId,
          email: data.email,
          displayName: data.displayName,
          profileImageUrl: data.profileImageUrl ?? null,
          accessTokenEncrypted: data.encryptedAccessToken,
          refreshTokenEncrypted: data.encryptedRefreshToken ?? null,
          tokenExpiresAt: data.tokenExpiresAt,
          scopes: data.scopes,
          status: "CONNECTED",
          lastConnectedAt: now,
        },
        select: {
          id: true,
          email: true,
          displayName: true,
          googleUserId: true,
          profileImageUrl: true,
          scopes: true,
          status: true,
          tokenExpiresAt: true,
          lastConnectedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return created as unknown as GoogleAccount;
    } catch (error) {
      console.error("Error upserting Google account in database:", error);
      throw error;
    }
  },

  /**
   * Internal server-only method to retrieve encrypted credentials for token refresh.
   * NEVER call this from client components or return its result in API responses.
   */
  async getEncryptedTokens(id: string): Promise<{
    accessTokenEncrypted: string | null;
    refreshTokenEncrypted: string | null;
    tokenExpiresAt: Date | null;
  } | null> {
    if (!isDatabaseConfigured()) {
      return null;
    }
    try {
      const record = await prisma.googleAccount.findUnique({
        where: { id },
        select: {
          accessTokenEncrypted: true,
          refreshTokenEncrypted: true,
          tokenExpiresAt: true,
        },
      });
      return record;
    } catch {
      return null;
    }
  },

  /**
   * Updates encrypted access token and expiry after a successful server-side refresh.
   */
  async updateRefreshedTokens(
    id: string,
    data: {
      encryptedAccessToken: string;
      tokenExpiresAt: Date;
      encryptedRefreshToken?: string;
    }
  ): Promise<boolean> {
    if (!isDatabaseConfigured()) {
      return true;
    }
    try {
      await prisma.googleAccount.update({
        where: { id },
        data: {
          accessTokenEncrypted: data.encryptedAccessToken,
          tokenExpiresAt: data.tokenExpiresAt,
          ...(data.encryptedRefreshToken
            ? { refreshTokenEncrypted: data.encryptedRefreshToken }
            : {}),
          status: "CONNECTED",
        },
      });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Updates the account connection status.
   */
  async updateStatus(id: string, status: GoogleAccountStatus): Promise<boolean> {
    if (!isDatabaseConfigured()) {
      return false;
    }
    try {
      await prisma.googleAccount.update({
        where: { id },
        data: { status },
      });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Disconnects an account: marks status DISCONNECTED and permanently zeroes out tokens.
   */
  async disconnect(id: string): Promise<boolean> {
    if (!isDatabaseConfigured()) {
      return false;
    }
    try {
      await prisma.googleAccount.update({
        where: { id },
        data: {
          status: "DISCONNECTED",
          accessTokenEncrypted: null,
          refreshTokenEncrypted: null,
          tokenExpiresAt: null,
        },
      });
      return true;
    } catch {
      return false;
    }
  },
};
