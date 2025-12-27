import { google } from 'googleapis';
import { writeFileSync, existsSync } from 'fs';
import { createServer, type Server, type IncomingMessage, type ServerResponse } from 'http';
import { URL } from 'url';
import {
  getOAuthCredentials,
  getTokenPath,
  loadStoredToken,
  type TokenData,
} from './credentials.js';

const SCOPES = ['https://www.googleapis.com/auth/webmasters'];

export interface GoogleAuth {
  oauth2Client: InstanceType<typeof google.auth.OAuth2>;
  searchConsole: ReturnType<typeof google.searchconsole>;
}

/**
 * Creates an OAuth2 client with the configured credentials
 */
export function createOAuth2Client() {
  const { clientId, clientSecret } = getOAuthCredentials();

  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    'http://localhost:3000/oauth/callback'
  );
}

/**
 * Generates the OAuth consent URL
 */
export function getAuthUrl(oauth2Client: InstanceType<typeof google.auth.OAuth2>): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Force consent to get refresh token
  });
}

/**
 * Exchanges an authorization code for tokens
 */
export async function exchangeCodeForTokens(
  oauth2Client: InstanceType<typeof google.auth.OAuth2>,
  code: string
): Promise<TokenData> {
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Failed to obtain tokens from Google');
  }

  const tokenData: TokenData = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_type: tokens.token_type ?? 'Bearer',
    expiry_date: tokens.expiry_date ?? Date.now() + 3600 * 1000,
    scope: tokens.scope,
  };

  return tokenData;
}

/**
 * Saves tokens to the configured token path
 */
export function saveToken(token: TokenData): void {
  const tokenPath = getTokenPath();
  writeFileSync(tokenPath, JSON.stringify(token, null, 2));
}

/**
 * Runs the OAuth flow in a local browser
 * Opens a browser window and waits for the callback
 */
export async function runOAuthFlow(): Promise<TokenData> {
  const oauth2Client = createOAuth2Client();
  const authUrl = getAuthUrl(oauth2Client);

  console.log('\nOpening browser for Google OAuth consent...');
  console.log('If the browser does not open, visit this URL:\n');
  console.log(authUrl);
  console.log('\n');

  // Open browser
  const open = await import('open').then((m) => m.default).catch(() => null);
  if (open) {
    await open(authUrl);
  }

  // Start local server to receive callback
  return new Promise((resolve, reject) => {
    let server: Server | null = null;

    const handler = async (req: IncomingMessage, res: ServerResponse) => {
      try {
        const url = new URL(req.url ?? '/', `http://localhost:3000`);

        if (url.pathname === '/oauth/callback') {
          const code = url.searchParams.get('code');
          const error = url.searchParams.get('error');

          if (error) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end(`<h1>Authentication Failed</h1><p>${error}</p>`);
            reject(new Error(`OAuth error: ${error}`));
            server?.close();
            return;
          }

          if (!code) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end('<h1>Authentication Failed</h1><p>No code received</p>');
            reject(new Error('No authorization code received'));
            server?.close();
            return;
          }

          const token = await exchangeCodeForTokens(oauth2Client, code);
          saveToken(token);

          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <head>
                <style>
                  body { font-family: system-ui; text-align: center; padding: 50px; }
                  h1 { color: #22c55e; }
                </style>
              </head>
              <body>
                <h1>Authentication Successful!</h1>
                <p>You can close this window and return to the terminal.</p>
              </body>
            </html>
          `);

          resolve(token);
          setTimeout(() => server?.close(), 1000);
        }
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`<h1>Error</h1><p>${err instanceof Error ? err.message : 'Unknown error'}</p>`);
        reject(err);
        server?.close();
      }
    };

    server = createServer(handler);
    server.listen(3000, () => {
      console.log('Waiting for OAuth callback on http://localhost:3000/oauth/callback...');
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      reject(new Error('OAuth timeout - no callback received within 5 minutes'));
      server?.close();
    }, 5 * 60 * 1000);
  });
}

/**
 * Gets an authenticated Google Auth client
 * Will use stored token if available, otherwise prompts for OAuth
 */
export async function getGoogleAuth(): Promise<GoogleAuth> {
  const oauth2Client = createOAuth2Client();
  let token = loadStoredToken();

  if (!token) {
    const tokenPath = getTokenPath();
    throw new Error(
      `No OAuth token found at ${tokenPath}.\n` +
        'Run "npm run auth" to authenticate with Google first.'
    );
  }

  oauth2Client.setCredentials({
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    expiry_date: token.expiry_date,
  });

  // Refresh token if expired
  if (token.expiry_date && token.expiry_date < Date.now()) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      token = {
        ...token,
        access_token: credentials.access_token ?? token.access_token,
        expiry_date: credentials.expiry_date ?? token.expiry_date,
      };
      saveToken(token);
    } catch {
      throw new Error(
        'Failed to refresh OAuth token. Run "npm run auth" to re-authenticate.'
      );
    }
  }

  const searchConsole = google.searchconsole({ version: 'v1', auth: oauth2Client });

  return { oauth2Client, searchConsole };
}

/**
 * Checks if authentication is configured
 */
export function isAuthConfigured(): boolean {
  try {
    getOAuthCredentials();
    return existsSync(getTokenPath());
  } catch {
    return false;
  }
}
