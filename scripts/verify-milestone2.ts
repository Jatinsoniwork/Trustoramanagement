/**
 * Automated Verification Script for Milestone 2: Google OAuth 2.0 & Token Vault
 *
 * Runs comprehensive security, encryption, CSRF, and data integrity tests.
 */

import crypto from "crypto";
import {
  encryptSecret,
  decryptSecret,
  TokenDecryptionError,
} from "../lib/security/encryption";
import {
  generateOAuthState,
  parseAndValidateOAuthState,
  createGoogleAuthUrl,
} from "../lib/oauth/google";

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failedTests++;
  }
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("  ReviewFlow Milestone 2: Automated Verification Suite");
  console.log("=======================================================\n");

  // Ensure test encryption key is set for this verification run
  process.env.TOKEN_ENCRYPTION_KEY =
    process.env.TOKEN_ENCRYPTION_KEY ||
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  process.env.GOOGLE_CLIENT_ID =
    process.env.GOOGLE_CLIENT_ID || "test-client-id-12345.apps.googleusercontent.com";
  process.env.GOOGLE_CLIENT_SECRET =
    process.env.GOOGLE_CLIENT_SECRET || "test-client-secret-xyz";
  process.env.GOOGLE_REDIRECT_URI =
    process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/auth/callback/google";

  // -------------------------------------------------------------------------
  // Test 1: AES-256-GCM Encryption & Decryption Round-Trip
  // -------------------------------------------------------------------------
  console.log("1. Testing AES-256-GCM Token Vault Encryption & Decryption:");
  try {
    const originalToken = "ya29.a0ARrdaM_test_google_oauth_access_token_super_secret_payload_98765";
    const encrypted = encryptSecret(originalToken);

    assert(typeof encrypted === "string", "Encrypted secret is a non-empty string");
    assert(encrypted.startsWith("v1:"), "Encrypted secret uses version prefix 'v1:'");

    const parts = encrypted.split(":");
    assert(parts.length === 4, "Encrypted format is v1:<iv>:<tag>:<ciphertext> (4 parts)");
    assert(parts[1].length === 24, "IV is exactly 12 bytes (24 hex characters)");
    assert(parts[2].length === 32, "Authentication tag is exactly 16 bytes (32 hex characters)");

    const decrypted = decryptSecret(encrypted);
    assert(decrypted === originalToken, "Decrypted secret exactly matches original token");
  } catch (err: unknown) {
    console.error("  ✗ AES-256-GCM Round-trip threw an unexpected error:", err);
    failedTests++;
  }

  // -------------------------------------------------------------------------
  // Test 2: Unique IV & Nonce Per Encryption Call
  // -------------------------------------------------------------------------
  console.log("\n2. Testing Unique Cryptographic Nonce/IV Per Operation:");
  try {
    const sampleToken = "refresh_token_sample_12345";
    const enc1 = encryptSecret(sampleToken);
    const enc2 = encryptSecret(sampleToken);

    assert(enc1 !== enc2, "Identical plaintext produces distinct ciphertexts");

    const iv1 = enc1.split(":")[1];
    const iv2 = enc2.split(":")[1];
    assert(iv1 !== iv2, "Distinct 12-byte IV generated for each encryption operation");

    assert(decryptSecret(enc1) === sampleToken, "Payload 1 decrypts cleanly");
    assert(decryptSecret(enc2) === sampleToken, "Payload 2 decrypts cleanly");
  } catch (err: unknown) {
    console.error("  ✗ Unique IV test failed:", err);
    failedTests++;
  }

  // -------------------------------------------------------------------------
  // Test 3: Authenticated Encryption Integrity & Tamper Detection
  // -------------------------------------------------------------------------
  console.log("\n3. Testing Tamper Detection & Authenticated Tag Verification:");
  try {
    const rawSecret = "1//04test_refresh_token_secret_data";
    const encrypted = encryptSecret(rawSecret);
    const [v, iv, tag, ct] = encrypted.split(":");

    // Test 3a: Tampered ciphertext
    const tamperedCt = ct.substring(0, ct.length - 2) + (ct.endsWith("a") ? "b" : "a");
    let caughtTamperedCt = false;
    try {
      decryptSecret(`${v}:${iv}:${tag}:${tamperedCt}`);
    } catch (err) {
      if (err instanceof TokenDecryptionError) {
        caughtTamperedCt = true;
      }
    }
    assert(caughtTamperedCt, "Tampered ciphertext is detected and throws TokenDecryptionError");

    // Test 3b: Tampered authentication tag
    const tamperedTag = tag.substring(0, tag.length - 2) + (tag.endsWith("0") ? "1" : "0");
    let caughtTamperedTag = false;
    try {
      decryptSecret(`${v}:${iv}:${tamperedTag}:${ct}`);
    } catch (err) {
      if (err instanceof TokenDecryptionError) {
        caughtTamperedTag = true;
      }
    }
    assert(caughtTamperedTag, "Tampered auth tag is detected and throws TokenDecryptionError");

    // Test 3c: Malformed format
    let caughtMalformed = false;
    try {
      decryptSecret("malformed_payload_without_colons");
    } catch (err) {
      if (err instanceof TokenDecryptionError) {
        caughtMalformed = true;
      }
    }
    assert(caughtMalformed, "Malformed payload format throws TokenDecryptionError");
  } catch (err: unknown) {
    console.error("  ✗ Tamper detection test failed:", err);
    failedTests++;
  }

  // -------------------------------------------------------------------------
  // Test 4: CSRF State Generation, Metadata & Expiration
  // -------------------------------------------------------------------------
  console.log("\n4. Testing OAuth CSRF State Token & Expiration Logic:");
  try {
    const stateToken = generateOAuthState({ accountId: "acc_test_77" });
    assert(typeof stateToken === "string" && stateToken.length > 20, "Generated CSRF state token");

    const validated = parseAndValidateOAuthState(stateToken);
    assert(validated.isValid === true, "Fresh CSRF state validates successfully");
    assert(validated.accountId === "acc_test_77", "OAuth state metadata preserved across exchange");

    // Expired state test (craft state with timestamp 15 minutes ago)
    const expiredPayload = JSON.stringify({
      nonce: crypto.randomBytes(24).toString("hex"),
      ts: Date.now() - 15 * 60 * 1000, // 15 mins ago (> 10 mins window)
      accountId: "acc_test_77",
    });
    const expiredState = Buffer.from(expiredPayload).toString("base64url");
    const expiredResult = parseAndValidateOAuthState(expiredState);
    assert(expiredResult.isValid === false, "State older than 10 minutes is rejected as expired");

    // Corrupted state test
    const corruptedResult = parseAndValidateOAuthState("not-valid-base64-json-%%%");
    assert(corruptedResult.isValid === false, "Malformed state token is rejected safely");
  } catch (err: unknown) {
    console.error("  ✗ CSRF state test failed:", err);
    failedTests++;
  }

  // -------------------------------------------------------------------------
  // Test 5: Authorization URL Parameter Verification
  // -------------------------------------------------------------------------
  console.log("\n5. Testing Google OAuth 2.0 Authorization URL Construction:");
  try {
    const state = generateOAuthState();
    const authUrl = createGoogleAuthUrl({ state });
    const parsedUrl = new URL(authUrl);

    assert(parsedUrl.origin === "https://accounts.google.com", "URL points to official Google OAuth endpoint");
    assert(parsedUrl.pathname === "/o/oauth2/v2/auth", "Path matches Google OAuth 2.0 authorization endpoint");
    assert(parsedUrl.searchParams.get("client_id") === process.env.GOOGLE_CLIENT_ID, "Client ID included");
    assert(parsedUrl.searchParams.get("redirect_uri") === "http://localhost:3000/api/auth/callback/google", "Redirect URI is strictly port 3000 callback (NOT db port 9999)");
    assert(parsedUrl.searchParams.get("response_type") === "code", "Response type is authorization code");
    assert(parsedUrl.searchParams.get("access_type") === "offline", "Access type is 'offline' for refresh token");
    assert(parsedUrl.searchParams.get("prompt") === "consent", "Prompt is 'consent' to guarantee refresh token generation");
    assert(parsedUrl.searchParams.get("state") === state, "State token matched");
  } catch (err: unknown) {
    console.error("  ✗ Auth URL test failed:", err);
    failedTests++;
  }

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log("\n=======================================================");
  console.log(`  Tests Passed: ${passedTests} | Tests Failed: ${failedTests}`);
  console.log("=======================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests();
