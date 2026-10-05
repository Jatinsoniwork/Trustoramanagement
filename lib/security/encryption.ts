import crypto from "crypto";

export class TokenEncryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TokenEncryptionError";
  }
}

export class TokenDecryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TokenDecryptionError";
  }
}

/**
 * Resolves and validates the 256-bit (32-byte) encryption key from environment variables.
 * Supported formats:
 * - 64-character hex string (32 bytes)
 * - 32-byte raw string
 * - 44-character Base64 string (32 bytes)
 */
export function getEncryptionKey(): Buffer {
  const rawKey =
    process.env.TOKEN_ENCRYPTION_KEY ||
    process.env.ENCRYPTION_KEY;

  if (!rawKey || rawKey.trim() === "") {
    throw new TokenEncryptionError(
      "TOKEN_ENCRYPTION_KEY is not configured in environment variables. AES-256-GCM token encryption requires a 256-bit key."
    );
  }

  const trimmed = rawKey.trim();

  // 1. If 64 hex chars, decode from hex
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return Buffer.from(trimmed, "hex");
  }

  // 2. If exactly 32 bytes in UTF-8
  const utf8Buf = Buffer.from(trimmed, "utf8");
  if (utf8Buf.length === 32) {
    return utf8Buf;
  }

  // 3. If Base64 string resolving to 32 bytes
  try {
    const b64Buf = Buffer.from(trimmed, "base64");
    if (b64Buf.length === 32) {
      return b64Buf;
    }
  } catch {
    // Ignore and proceed to length error below
  }

  throw new TokenEncryptionError(
    `Invalid TOKEN_ENCRYPTION_KEY length: got ${utf8Buf.length} bytes, expected 32 bytes (256-bit key). Provide a 64-char hex or 32-char key.`
  );
}

/**
 * Encrypts a sensitive string (access token, refresh token) using AES-256-GCM.
 * Output format: v1:<iv_hex>:<auth_tag_hex>:<ciphertext_hex>
 *
 * Guarantees:
 * - 256-bit encryption key
 * - Cryptographically secure unique IV (12 bytes) per invocation
 * - Authenticated encryption with 128-bit authentication tag
 * - Unambiguous versioned format
 */
export function encryptSecret(plaintext: string): string {
  if (!plaintext || typeof plaintext !== "string") {
    throw new TokenEncryptionError("Cannot encrypt empty or non-string secret.");
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // Recommended IV size for AES-GCM is 96 bits (12 bytes)

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `v1:${iv.toString("hex")}:${authTag.toString("hex")}:${ciphertext.toString("hex")}`;
}

/**
 * Decrypts a versioned AES-256-GCM encrypted token payload.
 * Verifies authenticity tag. If ciphertext was modified or tag is invalid, fails safely.
 */
export function decryptSecret(encryptedPayload: string): string {
  if (!encryptedPayload || typeof encryptedPayload !== "string") {
    throw new TokenDecryptionError("Cannot decrypt empty or non-string payload.");
  }

  const parts = encryptedPayload.split(":");
  if (parts.length !== 4) {
    throw new TokenDecryptionError(
      "Malformed encrypted token format. Expected 'version:iv:tag:ciphertext'."
    );
  }

  const [version, ivHex, authTagHex, ciphertextHex] = parts;

  if (version !== "v1") {
    throw new TokenDecryptionError(
      `Unsupported encrypted token version: '${version}'.`
    );
  }

  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const ciphertext = Buffer.from(ciphertextHex, "hex");

    if (iv.length !== 12) {
      throw new Error("Invalid IV length.");
    }
    if (authTag.length !== 16) {
      throw new Error("Invalid authentication tag length.");
    }

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch {
    // Fail safely without leaking key, IV, or internal stack trace
    throw new TokenDecryptionError(
      "Decryption failed: Token is corrupt, tampered with, or encryption key mismatch."
    );
  }
}
