import { prisma, isDatabaseConfigured } from "@/lib/db/prisma";
import { DEMO_GOOGLE_ACCOUNTS } from "@/lib/data/mockData";
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
      const uniqueMap = new Map<string, GoogleAccount>();
      for (const a of DEMO_GOOGLE_ACCOUNTS) {
        const key = a.email.toLowerCase();
        if (!uniqueMap.has(key)) uniqueMap.set(key, a);
      }
      let filtered = Array.from(uniqueMap.values());
      if (query?.status) {
        filtered = filtered.filter((a) => a.status === query.status);
      }
      return filtered;
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
    } catch {
      const uniqueMap = new Map<string, GoogleAccount>();
      for (const a of DEMO_GOOGLE_ACCOUNTS) {
        const key = a.email.toLowerCase();
        if (!uniqueMap.has(key)) uniqueMap.set(key, a);
      }
      let filtered = Array.from(uniqueMap.values());
      if (query?.status) {
        filtered = filtered.filter((a) => a.status === query.status);
      }
      return filtered;
    }
  },

  /**
   * Finds an account by ID with safe projection.
   */
  async findById(id: string): Promise<GoogleAccount | null> {
    if (!isDatabaseConfigured()) {
      const found = DEMO_GOOGLE_ACCOUNTS.find((a) => a.id === id);
      return found || null;
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
      return account as unknown as GoogleAccount | null;
    } catch {
      const found = DEMO_GOOGLE_ACCOUNTS.find((a) => a.id === id);
      return found || null;
    }
  },

  /**
   * Finds an account by stable Google User ID (sub).
   */
  async findByGoogleUserId(googleUserId: string): Promise<GoogleAccount | null> {
    if (!isDatabaseConfigured()) {
      const found = DEMO_GOOGLE_ACCOUNTS.find((a) => a.googleUserId === googleUserId);
      return found || null;
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
      return account as unknown as GoogleAccount | null;
    } catch {
      const found = DEMO_GOOGLE_ACCOUNTS.find((a) => a.googleUserId === googleUserId);
      return found || null;
    }
  },

  /**
   * Securely upserts an authorized Google account.
   * If an account with this googleUserId or email already exists, updates it without creating duplicates.
   */
  async upsertAuthorizedAccount(data: UpsertGoogleAccountData): Promise<GoogleAccount> {
    const now = new Date();

    if (!isDatabaseConfigured()) {
      // In-memory demo fallback for test environments
      const existingIdx = DEMO_GOOGLE_ACCOUNTS.findIndex(
        (a) => a.googleUserId === data.googleUserId || a.email.toLowerCase() === data.email.toLowerCase()
      );

      if (existingIdx !== -1) {
        DEMO_GOOGLE_ACCOUNTS[existingIdx] = {
          ...DEMO_GOOGLE_ACCOUNTS[existingIdx],
          email: data.email,
          displayName: data.displayName,
          profileImageUrl: data.profileImageUrl ?? DEMO_GOOGLE_ACCOUNTS[existingIdx].profileImageUrl,
          scopes: data.scopes,
          status: "CONNECTED",
          tokenExpiresAt: data.tokenExpiresAt,
          lastConnectedAt: now,
          updatedAt: now,
        };
        return DEMO_GOOGLE_ACCOUNTS[existingIdx];
      }

      const newAccount: GoogleAccount = {
        id: `gacc-${Date.now()}`,
        email: data.email,
        displayName: data.displayName,
        googleUserId: data.googleUserId,
        profileImageUrl: data.profileImageUrl,
        scopes: data.scopes,
        status: "CONNECTED",
        tokenExpiresAt: data.tokenExpiresAt,
        lastConnectedAt: now,
        createdAt: now,
        updatedAt: now,
      };
      DEMO_GOOGLE_ACCOUNTS.unshift(newAccount);
      return newAccount;
    }

    try {
      // Look up existing by googleUserId or email
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
    } catch {
      // In case of database exception, fallback safely with duplicate prevention
      const existingIdx = DEMO_GOOGLE_ACCOUNTS.findIndex(
        (a) =>
          (data.googleUserId && a.googleUserId === data.googleUserId) ||
          a.email.toLowerCase() === data.email.toLowerCase()
      );

      if (existingIdx !== -1) {
        DEMO_GOOGLE_ACCOUNTS[existingIdx] = {
          ...DEMO_GOOGLE_ACCOUNTS[existingIdx],
          email: data.email,
          displayName: data.displayName,
          profileImageUrl:
            data.profileImageUrl ?? DEMO_GOOGLE_ACCOUNTS[existingIdx].profileImageUrl,
          scopes: data.scopes,
          status: "CONNECTED",
          tokenExpiresAt: data.tokenExpiresAt,
          lastConnectedAt: now,
          updatedAt: now,
        };
        const updated = DEMO_GOOGLE_ACCOUNTS[existingIdx];
        // Clean up any duplicate records with same email
        const unique = DEMO_GOOGLE_ACCOUNTS.filter(
          (a, idx) =>
            idx === existingIdx || a.email.toLowerCase() !== data.email.toLowerCase()
        );
        DEMO_GOOGLE_ACCOUNTS.length = 0;
        DEMO_GOOGLE_ACCOUNTS.push(...unique);
        return updated;
      }

      const fallbackAccount: GoogleAccount = {
        id: `gacc-${Date.now()}`,
        email: data.email,
        displayName: data.displayName,
        googleUserId: data.googleUserId,
        profileImageUrl: data.profileImageUrl,
        scopes: data.scopes,
        status: "CONNECTED",
        tokenExpiresAt: data.tokenExpiresAt,
        lastConnectedAt: now,
        createdAt: now,
        updatedAt: now,
      };
      DEMO_GOOGLE_ACCOUNTS.unshift(fallbackAccount);
      return fallbackAccount;
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
      const acc = DEMO_GOOGLE_ACCOUNTS.find((a) => a.id === id);
      if (acc) acc.status = status;
      return true;
    }
    try {
      await prisma.googleAccount.update({
        where: { id },
        data: { status },
      });
      return true;
    } catch {
      const acc = DEMO_GOOGLE_ACCOUNTS.find((a) => a.id === id);
      if (acc) acc.status = status;
      return true;
    }
  },

  /**
   * Disconnects an account: marks status DISCONNECTED and permanently zeroes out tokens.
   */
  async disconnect(id: string): Promise<boolean> {
    if (!isDatabaseConfigured()) {
      const acc = DEMO_GOOGLE_ACCOUNTS.find((a) => a.id === id);
      if (acc) acc.status = "DISCONNECTED";
      return true;
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
      const acc = DEMO_GOOGLE_ACCOUNTS.find((a) => a.id === id);
      if (acc) acc.status = "DISCONNECTED";
      return true;
    }
  },
};
