import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { getGoogleAuth, isAuthConfigured } from './auth/oauth.js';
import { getServiceAccountAuth, isServiceAccountConfigured } from './auth/service-account.js';
import { toolDefinitions, executeTool } from './tools/index.js';
import { logger } from './utils/logger.js';

const SERVER_NAME = 'gsc-mcp-server';
const SERVER_VERSION = '0.1.0';

/**
 * Creates and configures the MCP server
 */
export async function createServer(): Promise<Server> {
  logger.info(`Starting ${SERVER_NAME} v${SERVER_VERSION}`);

  // Initialize Google auth
  let searchConsole: Awaited<ReturnType<typeof getGoogleAuth>>['searchConsole'] | null = null;

  // Try OAuth first, then service account
  if (isAuthConfigured()) {
    logger.debug('Using OAuth authentication');
    const auth = await getGoogleAuth();
    searchConsole = auth.searchConsole;
  } else if (isServiceAccountConfigured()) {
    logger.debug('Using service account authentication');
    const auth = await getServiceAccountAuth();
    if (auth) {
      searchConsole = auth.searchConsole;
    }
  }

  if (!searchConsole) {
    throw new Error(
      'No authentication configured. Either:\n' +
        '1. Run "npm run auth" to authenticate with OAuth, or\n' +
        '2. Set GSC_SERVICE_ACCOUNT_PATH to use a service account'
    );
  }

  // Create a const reference for use in closures (TypeScript narrowing)
  const gscClient = searchConsole;

  logger.info('Successfully authenticated with Google Search Console');

  // Create MCP server
  const server = new Server(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register tool list handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.debug('Handling ListTools request');
    return {
      tools: toolDefinitions.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    };
  });

  // Register tool call handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    logger.debug(`Handling CallTool request: ${name}`);

    try {
      const result = await executeTool(gscClient, name, args ?? {});

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      logger.error(`Error executing tool ${name}`, error);

      return {
        content: [
          {
            type: 'text',
            text: `Error executing ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

/**
 * Runs the MCP server with STDIO transport
 */
export async function runServer(): Promise<void> {
  try {
    const server = await createServer();
    const transport = new StdioServerTransport();

    await server.connect(transport);
    logger.info('MCP server running on STDIO');

    // Handle shutdown
    process.on('SIGINT', async () => {
      logger.info('Shutting down...');
      await server.close();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    console.error('Failed to start server:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
