# Google OAuth Setup Guide

This guide walks you through creating Google OAuth 2.0 credentials for the GSC MCP Server.

## Prerequisites

- A Google account with access to Google Search Console properties
- Access to [Google Cloud Console](https://console.cloud.google.com)

## Step 1: Create or Select a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click the project dropdown at the top
3. Either:
   - Select an existing project, or
   - Click "New Project" and create one (e.g., "GSC MCP Server")

## Step 2: Enable the Search Console API

1. In the Cloud Console, go to **APIs & Services > Library**
2. Search for "Search Console API"
3. Click on "Google Search Console API"
4. Click **Enable**

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**
2. Select **External** (unless you have a Google Workspace org)
3. Click **Create**
4. Fill in the required fields:
   - **App name**: "GSC MCP Server" (or your preferred name)
   - **User support email**: Your email
   - **Developer contact**: Your email
5. Click **Save and Continue**
6. On the Scopes page, click **Add or Remove Scopes**
7. Find and select: `https://www.googleapis.com/auth/webmasters`
8. Click **Update** then **Save and Continue**
9. Add your email as a test user (required for External apps in testing)
10. Click **Save and Continue** then **Back to Dashboard**

## Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth 2.0 Client ID**
3. Select **Desktop app** as the application type
4. Name it "GSC MCP Desktop Client" (or your preference)
5. Click **Create**
6. A dialog shows your Client ID and Client Secret - **copy these**

## Step 5: Configure the MCP Server

1. Copy `.env.example` to `.env` in your project:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your credentials:
   ```bash
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

## Step 6: Authenticate

Run the authentication command:

```bash
npm run auth
```

This will:
1. Open your browser to Google's consent screen
2. Ask you to select your Google account
3. Show the permissions being requested
4. After approval, save the token locally

You should see:
```
Authentication successful!
Token saved to: ./token.json
```

## Troubleshooting

### "Access blocked: This app's request is invalid"

- Make sure you added yourself as a test user in the OAuth consent screen
- Verify the consent screen is configured correctly

### "Error 400: redirect_uri_mismatch"

- The OAuth client type must be "Desktop app"
- If using Web application type, add `http://localhost:3000/oauth/callback` to authorized redirect URIs

### "API not enabled"

- Go back to Step 2 and ensure the Search Console API is enabled

### "Scope not granted"

- Re-run `npm run auth` and make sure to approve all requested permissions
- Delete `token.json` and try again

## Security Notes

- **Never commit credentials**: The `.env` and `token.json` files are gitignored
- **Token refresh**: The OAuth token auto-refreshes; you rarely need to re-auth
- **Revoke access**: Go to [Google Account Security](https://myaccount.google.com/permissions) to revoke

## Alternative: Service Account

For server-to-server authentication without user interaction:

1. Go to **IAM & Admin > Service Accounts**
2. Create a service account
3. Download the JSON key file
4. In Google Search Console, add the service account email as a user
5. Set `GSC_SERVICE_ACCOUNT_PATH` in your environment

```bash
GSC_SERVICE_ACCOUNT_PATH=/path/to/service-account.json
```

Note: Service accounts must be explicitly added to each GSC property.
