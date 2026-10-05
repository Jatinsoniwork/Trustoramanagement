# Google OAuth 2.0 & Token Vault Setup Guide

This guide provides end-to-end instructions for configuring Google Cloud Console, setting up OAuth 2.0 credentials, generating the AES-256-GCM encryption key, and managing authorized Google accounts within **ReviewFlow**.

---

## 1. Google Cloud Console Setup

### Step 1: Create or Select a Google Cloud Project
1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click on the project dropdown at the top of the page.
3. Click **New Project**.
4. Set the project name (e.g., `ReviewFlow-Operator`) and organization if applicable.
5. Click **Create** and ensure the new project is selected in the project selector.

### Step 2: Configure the OAuth Consent Screen
1. In the left navigation sidebar, go to **APIs & Services** > **OAuth consent screen**.
2. Select User Type:
   - **Internal**: If operating exclusively within a Google Workspace organization.
   - **External**: Recommended for personal/standard operator accounts.
3. Click **Create**.
4. Fill in the required fields:
   - **App name**: `ReviewFlow`
   - **User support email**: Your operator email address
   - **Developer contact information**: Your operator email address
5. Click **Save and Continue**.

### Step 3: Configure Least-Privilege Scopes
1. On the **Scopes** page, click **Add or Remove Scopes**.
2. ReviewFlow requires strictly least-privilege identity scopes. Select:
   - `.../auth/userinfo.email` (View your email address)
   - `.../auth/userinfo.profile` (View your basic profile info)
   - `openid` (Associate you with your personal info on Google)
3. **DO NOT** select any Gmail, Drive, or unneeded sensitive scopes.
4. Click **Update** and then **Save and Continue**.

### Step 4: Add Test Users (If External & In Testing)
1. If your OAuth consent screen is in "Testing" status, you must add authorized Google accounts as test users.
2. Click **Add Users**.
3. Enter the email address(es) of the Google accounts you intend to connect as the operator.
4. Click **Save and Continue**.

---

## 2. Create OAuth 2.0 Client Credentials

1. In the left navigation, go to **APIs & Services** > **Credentials**.
2. Click **+ Create Credentials** at the top and select **OAuth client ID**.
3. Select Application type: **Web application**.
4. Set the Name: `ReviewFlow Web Client`.
5. Under **Authorized JavaScript origins**, add:
   - `http://localhost:3000`
6. Under **Authorized redirect URIs**, add:
   - `http://localhost:3000/api/auth/callback/google`
   
   > **CRITICAL NOTE ON PORTS:**
   > - The Next.js web application runs on port `3000`.
   > - The PostgreSQL database runs on port `9999` (or `5432`).
   > - **Never** set the redirect URI to port `9999`. The redirect URI must always point to the web application port (`http://localhost:3000/api/auth/callback/google`).
   > - In production, replace `http://localhost:3000` with your canonical HTTPS domain (e.g., `https://reviewflow.yourdomain.com/api/auth/callback/google`).

7. Click **Create**.
8. A modal will display your **Client ID** and **Client Secret**. Copy both values for your `.env` configuration.

---

## 3. Generate AES-256-GCM Encryption Key

ReviewFlow protects OAuth access and refresh tokens at rest in PostgreSQL using AES-256-GCM authenticated encryption. A 256-bit (32-byte) key is required.

Generate a secure random key using any of the following methods:

### Method A: Node.js (Built-in)
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Method B: OpenSSL
```bash
openssl rand -hex 32
```

### Method C: PowerShell
```powershell
$bytes = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes); -join ($bytes | ForEach-Object { "{0:x2}" -f $_ })
```

---

## 4. Configure Application Environment

Create or update your `.env` file in the project root:

```env
# Application Host
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Database Connection (PostgreSQL on port 9999)
DATABASE_URL="postgresql://postgres:postgres@localhost:9999/reviewflow?schema=public"

# Google OAuth 2.0 Credentials
GOOGLE_CLIENT_ID="1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/callback/google"

# OAuth Scopes
GOOGLE_OAUTH_SCOPES="openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile"

# Token Vault AES-256-GCM Encryption Key (64 hex characters = 32 bytes)
TOKEN_ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
```

---

## 5. Starting the Application & Connecting an Account

1. Start the development server:
   ```bash
   npm run dev
   ```
2. Open your browser and navigate to:
   ```
   http://localhost:3000/google-accounts
   ```
3. Click the **Connect Google Account** button.
4. Review the security modal confirming that ReviewFlow uses official Google OAuth consent with zero password collection.
5. Click **Proceed to Google**.
6. On the Google Consent Screen:
   - Select your operator account.
   - Grant the requested permissions (`email` and `profile`).
7. Google will redirect back to `/api/auth/callback/google`.
8. ReviewFlow automatically:
   - Validates the cryptographic CSRF state token and cookie.
   - Exchanges the authorization code for tokens.
   - Fetches the user's verified identity (`googleUserId`, `email`, `displayName`, `avatar`).
   - Encrypts access and refresh tokens with AES-256-GCM.
   - Stores/upserts the record in the database.
   - Logs an audit activity entry.
   - Redirects to `/google-accounts?connected=true`.
9. The connected account card appears in the UI displaying:
   - Account email, name, and avatar
   - Connection status badge (`CONNECTED`)
   - AES-256 Encrypted badge
   - Scopes granted
   - **Test Refresh** button
   - **Disconnect** button

---

## 6. Troubleshooting Common OAuth Errors

### 1. `redirect_uri_mismatch`
- **Cause**: The redirect URI passed in the request does not exactly match one of the authorized redirect URIs in Google Cloud Console.
- **Solution**:
  1. Open Google Cloud Console > APIs & Services > Credentials.
  2. Click your OAuth 2.0 Client ID.
  3. Ensure `http://localhost:3000/api/auth/callback/google` is listed under **Authorized redirect URIs**.
  4. Ensure there is no trailing slash, mismatched port (e.g. `9999` vs `3000`), or `https` instead of `http`.
  5. Check `GOOGLE_REDIRECT_URI` in `.env`.

### 2. `invalid_client`
- **Cause**: The `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` in `.env` is incorrect, deleted, or contains accidental whitespace/quotes.
- **Solution**:
  1. Verify credentials in Google Cloud Console.
  2. Re-copy client ID and client secret into `.env`.
  3. Restart Next.js server so environment changes take effect.

### 3. `access_denied`
- **Cause**: The operator clicked "Cancel" on the Google consent screen, or the account is not registered under "Test Users" in an unverified app.
- **Solution**:
  1. If testing mode is enabled, add the target account under **OAuth consent screen > Test users**.
  2. If the user cancelled, simply re-click **Connect Google Account** and accept the consent prompt.

### 4. `invalid_grant` / Token Refresh Failure
- **Cause**: The user revoked access from their Google Account settings (`myaccount.google.com/permissions`), or the refresh token expired (6-month inactivity or password change).
- **Solution**:
  1. ReviewFlow's server-side refresh handler automatically catches `invalid_grant`.
  2. The account status is instantly updated to `REAUTH_REQUIRED`.
  3. The card in `/google-accounts` displays an alert and a **Reconnect** button.
  4. Clicking **Reconnect** launches a new consent prompt with `prompt=consent` to acquire a fresh valid refresh token.

### 5. `TokenEncryptionError: TOKEN_ENCRYPTION_KEY is not configured`
- **Cause**: The `TOKEN_ENCRYPTION_KEY` is missing from `.env` or is not 32 bytes (64 hex characters).
- **Solution**:
  1. Generate a 32-byte key using `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
  2. Add `TOKEN_ENCRYPTION_KEY="<key>"` to `.env`.
  3. Restart Next.js dev server.
