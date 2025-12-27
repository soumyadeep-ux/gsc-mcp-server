#!/usr/bin/env node

import { runOAuthFlow } from './oauth.js';
import { getOAuthCredentials, getTokenPath } from './credentials.js';
import { existsSync } from 'fs';

async function main() {
  console.log('GSC MCP Server - Authentication\n');

  // Check for credentials
  try {
    getOAuthCredentials();
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    console.log('\nMake sure you have a .env file with:');
    console.log('  GOOGLE_CLIENT_ID=your-client-id');
    console.log('  GOOGLE_CLIENT_SECRET=your-secret');
    process.exit(1);
  }

  // Check for existing token
  const tokenPath = getTokenPath();
  if (existsSync(tokenPath)) {
    console.log(`Existing token found at ${tokenPath}`);
    console.log('Re-authenticating will replace it.\n');
  }

  try {
    await runOAuthFlow();
    console.log('\nAuthentication successful!');
    console.log(`Token saved to: ${tokenPath}`);
    console.log('\nYou can now run the MCP server with: npm start');
  } catch (error) {
    console.error('\nAuthentication failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
