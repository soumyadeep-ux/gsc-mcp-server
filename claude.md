# GSC MCP Server

A TypeScript MCP server providing Google Search Console access for AI assistants.

## Project Overview

This is a Model Context Protocol (MCP) server that enables AI assistants like Claude to query Google Search Console data. It uses the official `@modelcontextprotocol/sdk` and Google's `googleapis` library.

## Architecture

```
src/
├── index.ts              # STDIO entrypoint, loads env and runs server
├── server.ts             # MCP server factory, registers tools
├── auth/
│   ├── index.ts          # Re-exports
│   ├── credentials.ts    # Env var loading, credential types
│   ├── oauth.ts          # OAuth 2.0 flow with browser auth
│   ├── service-account.ts # Service account authentication
│   └── cli.ts            # `npm run auth` CLI tool
├── tools/
│   ├── index.ts          # Tool registry and executor
│   ├── list-sites.ts     # gsc.list_sites implementation
│   ├── search-analytics.ts # gsc.search_analytics implementation
│   ├── url-inspection.ts # gsc.inspect_url implementation
│   └── sitemaps.ts       # gsc.list_sitemaps, submit, delete
├── schemas/
│   ├── index.ts          # Re-exports
│   └── inputs.ts         # Zod schemas for tool inputs
└── utils/
    ├── index.ts          # Re-exports
    ├── date.ts           # Date formatting utilities
    ├── errors.ts         # Google API error handling
    ├── format.ts         # Output formatting (tables, lists)
    └── logger.ts         # Logging with level control
```

## Key Files

| File | Purpose |
|------|---------|
| `src/server.ts` | Creates MCP server, registers tool handlers |
| `src/auth/oauth.ts` | OAuth 2.0 flow with local callback server |
| `src/tools/index.ts` | Tool definitions and dispatcher |
| `src/schemas/inputs.ts` | Zod schemas with descriptions |

## Setup Checklist

1. [ ] Clone repo and run `npm install`
2. [ ] Create Google Cloud project at console.cloud.google.com
3. [ ] Enable "Search Console API" in APIs & Services
4. [ ] Create OAuth 2.0 credentials (Desktop app type)
5. [ ] Copy `.env.example` to `.env`
6. [ ] Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env`
7. [ ] Run `npm run auth` to authenticate with Google
8. [ ] Run `npm run build` to compile TypeScript
9. [ ] Configure Claude Desktop with MCP config (see README.md)

## Running Locally

```bash
# Development with hot reload
npm run dev

# Production build
npm run build
npm start

# Test with MCP inspector
npm run inspector
```

## Claude Desktop Config

```json
{
  "mcpServers": {
    "gsc": {
      "command": "node",
      "args": ["/absolute/path/to/gsc-mcp-server/dist/index.js"],
      "env": {
        "GOOGLE_CLIENT_ID": "your-id.apps.googleusercontent.com",
        "GOOGLE_CLIENT_SECRET": "GOCSPX-xxxxx"
      }
    }
  }
}
```

## Tool Catalog

### gsc.list_sites

List all GSC properties the user has access to.

**Input:** None (empty object)

**Output:** Table of site URLs with permission levels

**Example prompt:** "List all my Search Console sites"

### gsc.search_analytics

Query search performance metrics with filtering.

**Input:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `siteUrl` | string | Yes | - | GSC property URL |
| `startDate` | string | No | 28 days ago | YYYY-MM-DD format |
| `endDate` | string | No | Today | YYYY-MM-DD format |
| `dimensions` | string[] | No | ["query"] | query, page, country, device, date |
| `rowLimit` | number | No | 100 | 1-25000 |
| `startRow` | number | No | 0 | Pagination offset |
| `searchType` | string | No | "web" | web, image, video, news, discover |
| `filters` | object[] | No | - | Dimension filters |

**Filter Object:**
```typescript
{
  dimension: "query" | "page" | "country" | "device",
  operator: "equals" | "contains" | "notContains" | "notEquals",
  expression: "string value"
}
```

**Example prompts:**
- "Show my top 10 keywords by clicks"
- "What pages have more than 1000 impressions but CTR under 2%?"
- "Show queries containing 'seo' for the last 7 days"

### gsc.inspect_url

Check indexing status, crawl info, and mobile usability for a URL.

**Input:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `siteUrl` | string | Yes | GSC property URL |
| `inspectionUrl` | string | Yes | Full URL to inspect |

**Output:** Detailed report including:
- Indexing status and coverage state
- Last crawl time and page fetch state
- Canonical URLs (Google vs user-declared)
- Mobile usability verdict and issues
- Rich results detection
- AMP status (if applicable)

**Example prompts:**
- "Is https://example.com/pricing indexed?"
- "Check the mobile usability of my homepage"
- "What's the indexing status of https://example.com/blog/post-1"

### gsc.list_sitemaps

List all sitemaps submitted to a GSC property.

**Input:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `siteUrl` | string | Yes | GSC property URL |

**Output:** Table of sitemaps with:
- Sitemap URL and type
- Last submitted and downloaded dates
- Warning and error counts
- Content breakdown (URLs submitted vs indexed)

**Example prompt:** "List all sitemaps for my site"

### gsc.submit_sitemap

Submit a new sitemap to Google Search Console.

**Input:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `siteUrl` | string | Yes | GSC property URL |
| `sitemapUrl` | string | Yes | Full sitemap URL to submit |

**Output:** Confirmation message

**Example prompt:** "Submit https://example.com/sitemap.xml to Search Console"

### gsc.delete_sitemap

Remove a sitemap from Google Search Console.

**Input:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `siteUrl` | string | Yes | GSC property URL |
| `sitemapUrl` | string | Yes | Sitemap URL to delete |

**Output:** Confirmation message

**Example prompt:** "Delete the old sitemap from my Search Console"

## How to Add a New Tool

### Step 1: Define Input Schema

Create a Zod schema in `src/schemas/inputs.ts`:

```typescript
export const MyNewToolInputSchema = z.object({
  siteUrl: z.string().describe('GSC property URL'),
  myParam: z.string().optional().describe('Description for AI'),
});
export type MyNewToolInput = z.infer<typeof MyNewToolInputSchema>;
```

### Step 2: Create Tool Implementation

Create `src/tools/my-new-tool.ts`:

```typescript
import type { searchconsole_v1 } from 'googleapis';
import type { MyNewToolInput } from '../schemas/inputs.js';
import { formatToolError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export const myNewToolDescription = 'What this tool does';

export async function myNewTool(
  searchConsole: searchconsole_v1.Searchconsole,
  input: MyNewToolInput
): Promise<string> {
  logger.debug('Executing my_new_tool', { siteUrl: input.siteUrl });

  try {
    // Call Google API
    const response = await searchConsole.someResource.someMethod({
      siteUrl: input.siteUrl,
    });

    // Format output
    return `Result: ${JSON.stringify(response.data, null, 2)}`;
  } catch (error) {
    logger.error('Error in my_new_tool', error);
    return formatToolError(error);
  }
}
```

### Step 3: Register Tool

Update `src/tools/index.ts`:

```typescript
import { myNewTool, myNewToolDescription } from './my-new-tool.js';
import { MyNewToolInputSchema } from '../schemas/inputs.js';

// Add to toolDefinitions array
export const toolDefinitions: ToolDefinition[] = [
  // ... existing tools
  {
    name: 'gsc.my_new_tool',
    description: myNewToolDescription,
    inputSchema: zodToJsonSchema(MyNewToolInputSchema),
  },
];

// Add to executeTool switch
export async function executeTool(...) {
  switch (toolName) {
    // ... existing cases
    case 'gsc.my_new_tool': {
      const input = MyNewToolInputSchema.parse(args);
      return myNewTool(searchConsole, input);
    }
  }
}
```

### Step 4: Test and Document

1. Run `npm run build` to check for errors
2. Test with `npm run inspector`
3. Add to README.md tool table
4. Update this file's Tool Catalog

## Code Conventions

### TypeScript
- Strict mode enabled
- Use explicit types for function parameters
- Prefer `interface` for object shapes, `type` for unions

### Error Handling
- All tools return strings (MCP convention)
- Use `formatToolError()` for consistent error messages
- Never expose internal errors or tokens to users

### Logging
- Use `logger.debug()` for tool execution
- Use `logger.error()` for caught exceptions
- Never log credentials or tokens

### Testing
- Mock Google APIs using vitest mocks
- Test happy path and error cases
- Run `npm test` before committing

## Google Search Console API Reference

The server uses these GSC API resources:

| Resource | Method | Tool |
|----------|--------|------|
| `sites` | `list()` | gsc.list_sites |
| `searchanalytics` | `query()` | gsc.search_analytics |
| `urlInspection.index` | `inspect()` | gsc.inspect_url |
| `sitemaps` | `list()` | gsc.list_sitemaps |
| `sitemaps` | `submit()` | gsc.submit_sitemap |
| `sitemaps` | `delete()` | gsc.delete_sitemap |

API Documentation: https://developers.google.com/webmaster-tools/v1/api_reference_index

## Deployment Options

### STDIO (Claude Desktop)
Default mode. Configure in `claude_desktop_config.json`.

### HTTP Server (planned)
For Claude.ai and ChatGPT integration:
```bash
npm run start:http
```

See Ekamoira's hosted MCP at https://app.ekamoira.com/tools/gsc for a production example.

## Troubleshooting

### Token expired
```bash
rm token.json && npm run auth
```

### API not enabled
Enable "Search Console API" in Google Cloud Console.

### Permission denied
- Verify GSC property access
- Check OAuth scopes
- Re-authenticate with `npm run auth`

### Claude Desktop issues
- Use absolute paths in config
- Restart Claude Desktop completely
- Check `~/Library/Logs/Claude/` for errors

## File Modification Guidelines

When modifying this codebase:

1. **Adding tools**: Follow the 4-step process above
2. **Changing auth**: Update both OAuth and service account paths
3. **Updating schemas**: Regenerate JSON schemas with zodToJsonSchema
4. **Fixing bugs**: Add tests for the regression case

Always run before committing:
```bash
npm run lint && npm run typecheck && npm test
```
