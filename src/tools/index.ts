import { zodToJsonSchema } from 'zod-to-json-schema';
import type { searchconsole_v1 } from 'googleapis';
import {
  ListSitesInputSchema,
  SearchAnalyticsInputSchema,
} from '../schemas/inputs.js';
import { listSites, listSitesDescription } from './list-sites.js';
import { searchAnalytics, searchAnalyticsDescription } from './search-analytics.js';

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

/**
 * All available MCP tools
 */
export const toolDefinitions: ToolDefinition[] = [
  {
    name: 'gsc.list_sites',
    description: listSitesDescription,
    inputSchema: zodToJsonSchema(ListSitesInputSchema),
  },
  {
    name: 'gsc.search_analytics',
    description: searchAnalyticsDescription,
    inputSchema: zodToJsonSchema(SearchAnalyticsInputSchema),
  },
];

/**
 * Executes a tool by name with the given arguments
 */
export async function executeTool(
  searchConsole: searchconsole_v1.Searchconsole,
  toolName: string,
  args: Record<string, unknown>
): Promise<string> {
  switch (toolName) {
    case 'gsc.list_sites':
      return listSites(searchConsole);

    case 'gsc.search_analytics': {
      const input = SearchAnalyticsInputSchema.parse(args);
      return searchAnalytics(searchConsole, input);
    }

    default:
      return `Unknown tool: ${toolName}`;
  }
}

export { listSites } from './list-sites.js';
export { searchAnalytics } from './search-analytics.js';
