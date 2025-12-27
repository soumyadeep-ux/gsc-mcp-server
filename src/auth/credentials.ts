import { readFileSync, existsSync } from 'fs';
import { config } from 'dotenv';

// Load environment variables
config();

export interface OAuthCredentials {
  clientId: string;
  clientSecret: string;
}

export interface ServiceAccountCredentials {
  type: 'service_account';
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
}

export interface TokenData {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expiry_date: number;
  scope?: string;
}

export function getOAuthCredentials(): OAuthCredentials {
  const clientId = process.env['GOOGLE_CLIENT_ID'];
  const clientSecret = process.env['GOOGLE_CLIENT_SECRET'];

  if (!clientId || !clientSecret) {
    throw new Error(
      'Missing Google OAuth credentials. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file.\n' +
        'See: https://console.cloud.google.com/apis/credentials'
    );
  }

  return { clientId, clientSecret };
}

export function getServiceAccountCredentials(): ServiceAccountCredentials | null {
  const path = process.env['GSC_SERVICE_ACCOUNT_PATH'];

  if (!path) {
    return null;
  }

  if (!existsSync(path)) {
    throw new Error(`Service account file not found: ${path}`);
  }

  try {
    const content = readFileSync(path, 'utf-8');
    return JSON.parse(content) as ServiceAccountCredentials;
  } catch (error) {
    throw new Error(`Failed to parse service account file: ${path}`);
  }
}

export function getTokenPath(): string {
  return process.env['GSC_TOKEN_PATH'] ?? './token.json';
}

export function loadStoredToken(): TokenData | null {
  const tokenPath = getTokenPath();

  if (!existsSync(tokenPath)) {
    return null;
  }

  try {
    const content = readFileSync(tokenPath, 'utf-8');
    return JSON.parse(content) as TokenData;
  } catch {
    return null;
  }
}

export function getDefaultSite(): string | undefined {
  return process.env['GSC_DEFAULT_SITE'];
}

export function getLogLevel(): 'debug' | 'info' | 'warn' | 'error' {
  const level = process.env['GSC_LOG_LEVEL']?.toLowerCase();
  if (level === 'debug' || level === 'info' || level === 'warn' || level === 'error') {
    return level;
  }
  return 'info';
}
