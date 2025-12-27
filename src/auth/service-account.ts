import { google } from 'googleapis';
import { getServiceAccountCredentials } from './credentials.js';

const SCOPES = ['https://www.googleapis.com/auth/webmasters'];

export interface ServiceAccountAuth {
  authClient: InstanceType<typeof google.auth.GoogleAuth>;
  searchConsole: ReturnType<typeof google.searchconsole>;
}

/**
 * Gets a Google Auth client using service account credentials
 */
export async function getServiceAccountAuth(): Promise<ServiceAccountAuth | null> {
  const credentials = getServiceAccountCredentials();

  if (!credentials) {
    return null;
  }

  const authClient = new google.auth.GoogleAuth({
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    },
    scopes: SCOPES,
  });

  const searchConsole = google.searchconsole({
    version: 'v1',
    auth: authClient,
  });

  return { authClient, searchConsole };
}

/**
 * Checks if service account is configured
 */
export function isServiceAccountConfigured(): boolean {
  try {
    return getServiceAccountCredentials() !== null;
  } catch {
    return false;
  }
}
