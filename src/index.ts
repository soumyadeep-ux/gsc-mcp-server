#!/usr/bin/env node

import { config } from 'dotenv';

// Load environment variables
config();

import { runServer } from './server.js';

// Run the server
runServer();
