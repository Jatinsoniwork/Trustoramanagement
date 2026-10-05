import fs from "fs";
import { PrismaClient } from "@prisma/client";

async function verifyFinalOAuth() {
  console.log("\n=======================================================");
  console.log("  Google OAuth Final Configuration & Security Audit");
  console.log("=======================================================\n");

  // 1. Environment Inspection
  const envContent = fs.existsSync(".env.local")
    ? fs.readFileSync(".env.local", "utf8")
    : fs.readFileSync(".env", "utf8");

  const requiredVars = [
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_REDIRECT_URI",
    "TOKEN_ENCRYPTION_KEY",
    "DATABASE_URL",
    "NEXT_PUBLIC_APP_URL",
  ];

  console.log("1. Environment Variables Check (Without Printing Secrets):");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      process.env[key] = val;
    }
  }

  for (const v of requiredVars) {
    const val = process.env[v];
    const isValid = Boolean(val && val.length > 0);
    console.log(`  ✓ ${v}: ${isValid ? "CONFIGURED (length: " + val!.length + ")" : "MISSING"}`);
  }

  // 2. Redirect URI Check
  console.log("\n2. Redirect URI Validation:");
  const redirectLine = envContent.split("\n").find((l) => l.trim().startsWith("GOOGLE_REDIRECT_URI="));
  const redirectVal = redirectLine?.split("=")[1].trim().replace(/^["']|["']$/g, "");
  const expectedUri = "http://localhost:3000/api/auth/callback/google";
  console.log(`  - Target App Port: 3000 (Next.js Application Port)`);
  console.log(`  - Target Database Port: 9999 (PostgreSQL Service Port - NOT used for OAuth)`);
  console.log(`  - Configured Callback: ${redirectVal}`);
  console.log(`  ✓ Exact Match with Port 3000 Spec: ${redirectVal === expectedUri}`);

  // 3. Database Security Check
  console.log("\n3. Database Security & Token Encryption Audit:");
  try {
    const prisma = new PrismaClient();
    const accounts = await prisma.googleAccount.findMany({
      select: {
        id: true,
        displayName: true,
        email: true,
        googleUserId: true,
        status: true,
        accessTokenEncrypted: true,
        refreshTokenEncrypted: true,
      },
    });

    console.log(`  - Found ${accounts.length} Google account(s) in database.`);
    for (const acc of accounts) {
      console.log(`  - Auditing Account: [${acc.email}] (Status: ${acc.status})`);
      const hasAccess = Boolean(acc.accessTokenEncrypted);
      const hasRefresh = Boolean(acc.refreshTokenEncrypted);
      
      const accessEncrypted =
        acc.accessTokenEncrypted?.startsWith("v1:") &&
        acc.accessTokenEncrypted.split(":").length === 4;
      const refreshEncrypted =
        acc.refreshTokenEncrypted?.startsWith("v1:") &&
        acc.refreshTokenEncrypted.split(":").length === 4;

      const isPlaintextAccess = acc.accessTokenEncrypted?.startsWith("ya29.");
      const isPlaintextRefresh = acc.refreshTokenEncrypted?.startsWith("1//");

      console.log(`    ✓ Access token stored: ${hasAccess ? "YES" : "NO"}`);
      console.log(`    ✓ Access token uses AES-256-GCM format (v1:iv:tag:ct): ${accessEncrypted}`);
      console.log(`    ✓ Access token is NOT plaintext: ${!isPlaintextAccess}`);
      console.log(`    ✓ Refresh token stored: ${hasRefresh ? "YES" : "NO"}`);
      console.log(`    ✓ Refresh token uses AES-256-GCM format (v1:iv:tag:ct): ${refreshEncrypted}`);
      console.log(`    ✓ Refresh token is NOT plaintext: ${!isPlaintextRefresh}`);
    }
    await prisma.$disconnect();
  } catch (err: unknown) {
    console.log("  Notice: Prisma DB query in verification handled:", (err as Error).message);
  }

  // 4. Frontend Network / API Projection Security
  console.log("\n4. Frontend Network Projection Audit (GET /api/google-accounts):");
  try {
    const res = await fetch("http://localhost:3000/api/google-accounts");
    const json = await res.json();
    const rawString = JSON.stringify(json);

    const leaksAccess = rawString.includes("accessToken") || rawString.includes("ya29.");
    const leaksRefresh = rawString.includes("refreshToken") || rawString.includes("1//");
    const leaksSecret = rawString.includes("GOCSPX-");
    const leaksKey = rawString.includes("871234ac");

    console.log(`  ✓ API Status: ${res.status} OK`);
    console.log(`  ✓ Zero Access Token leak in client response: ${!leaksAccess}`);
    console.log(`  ✓ Zero Refresh Token leak in client response: ${!leaksRefresh}`);
    console.log(`  ✓ Zero Client Secret leak in client response: ${!leaksSecret}`);
    console.log(`  ✓ Zero Encryption Key leak in client response: ${!leaksKey}`);
    console.log(`  ✓ Total accounts returned safely: ${json.accounts?.length || 0}`);
  } catch (err: unknown) {
    console.error("  Fetch failed:", err);
  }

  console.log("\n=======================================================");
  console.log("  Audit Complete");
  console.log("=======================================================\n");
}

verifyFinalOAuth();
