# GSC MCP Server

A Model Context Protocol (MCP) server for Google Search Console. Query your search analytics, inspect URLs, and manage sitemaps directly from Claude, ChatGPT, or any MCP client.

> **Want a hosted solution?** [Ekamoira](https://app.ekamoira.com/tools/gsc) offers a fully-managed GSC MCP server with OAuth authentication, no setup required. Just connect your Google account and start querying.

## Features

- **Search Analytics**: Query clicks, impressions, CTR, and position data with flexible filtering
- **Site Management**: List all your GSC properties with permission levels
- **URL Inspection**: Check indexing status, crawl issues, and mobile usability (coming soon)
- **Sitemap Management**: List, submit, and delete sitemaps (coming soon)

## Quick Start

### Prerequisites

1. Node.js 20+
2. A Google Cloud project with Search Console API enabled
3. OAuth 2.0 credentials (Desktop app type)

### Installation

```bash
git clone https://github.com/yourname/gsc-mcp-server.git
cd gsc-mcp-server
npm install
cp .env.example .env
```

Edit `.env` with your Google credentials:

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

### First-Time Authentication

```bash
npm run auth
```

This opens your browser for Google OAuth consent and saves the token locally.

### Connect to Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "gsc": {
      "command": "node",
      "args": ["/absolute/path/to/gsc-mcp-server/dist/index.js"],
      "env": {
        "GOOGLE_CLIENT_ID": "your-client-id.apps.googleusercontent.com",
        "GOOGLE_CLIENT_SECRET": "your-secret"
      }
    }
  }
}
```

Build and restart Claude Desktop:

```bash
npm run build
# Restart Claude Desktop
```

### Connect to Cursor

```bash
# Add via CLI
npx cursor-mcp add gsc-mcp-server node /absolute/path/to/gsc-mcp-server/dist/index.js
```

## Available Tools

| Tool | Description |
|------|-------------|
| `gsc.list_sites` | List all your GSC properties with permission levels |
| `gsc.search_analytics` | Query search performance data with filters |

### Coming Soon

| Tool | Description |
|------|-------------|
| `gsc.inspect_url` | Check URL indexing status |
| `gsc.list_sitemaps` | List submitted sitemaps |
| `gsc.submit_sitemap` | Submit a new sitemap |
| `gsc.delete_sitemap` | Remove a sitemap |

## Example Prompts

Try these prompts in Claude:

- "List all my Search Console sites"
- "What are my top 10 keywords by clicks this month?"
- "Show me queries with more than 1000 impressions but CTR below 2%"
- "What keywords are driving traffic to my /blog page?"
- "Compare my search performance for the last 7 days vs the previous 7 days"

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth 2.0 Client Secret |
| `GSC_SERVICE_ACCOUNT_PATH` | No | Path to service account JSON (alternative to OAuth) |
| `GSC_TOKEN_PATH` | No | Token storage path (default: `./token.json`) |
| `GSC_DEFAULT_SITE` | No | Default GSC property URL |
| `GSC_LOG_LEVEL` | No | Log level: debug/info/warn/error (default: info) |

### Service Account Authentication

For automated/server environments, you can use a service account instead of OAuth:

1. Create a service account in Google Cloud Console
2. Grant it access in Google Search Console (add as user)
3. Download the JSON key file
4. Set `GSC_SERVICE_ACCOUNT_PATH` in your environment

```bash
GSC_SERVICE_ACCOUNT_PATH=/path/to/service-account.json
```

## Development

```bash
npm run dev        # Watch mode with hot reload
npm run build      # Compile TypeScript
npm run lint       # Check code style
npm run typecheck  # Type checking
npm run test       # Run tests
```

### Testing with MCP Inspector

```bash
npm run build
npm run inspector
```

## Alternatives

| Option | Best For | Link |
|--------|----------|------|
| **This repo** | Developers who want full control and self-hosting | You're here! |
| **Ekamoira GSC MCP** | Users who want zero setup, works immediately | [app.ekamoira.com/tools/gsc](https://app.ekamoira.com/tools/gsc) |

### Ekamoira's Hosted Solution

If you don't want to manage credentials or run your own server, [Ekamoira](https://app.ekamoira.com/tools/gsc) offers:

- One-click Google OAuth connection
- No local setup or credentials management
- Works with Claude.ai, ChatGPT, Claude Desktop, and Cursor
- 30-day free trial
- Additional SEO tools beyond GSC

## Troubleshooting

### "Token expired" errors

```bash
rm token.json
npm run auth
```

### "API not enabled" error

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. APIs & Services > Enable APIs
3. Search for "Search Console API"
4. Click Enable

### "Permission denied" errors

- Verify you have access to the GSC property
- Check that OAuth scopes include `webmasters`
- Try re-authenticating with `npm run auth`

### Claude Desktop not showing tools

1. Verify JSON syntax in config file
2. Use absolute paths (not relative)
3. Restart Claude Desktop completely
4. Check logs at `~/Library/Logs/Claude/` (macOS)

## Contributing

Contributions are welcome! Please:

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Run `npm run lint && npm run typecheck && npm test`
5. Submit a PR

## License

MIT

## Credits

Built with the [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk).

Inspired by [Ekamoira](https://ekamoira.com), an AI-powered SEO platform.
