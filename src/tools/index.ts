import { zodToJsonSchema } from 'zod-to-json-schema';
import type { searchconsole_v1 } from 'googleapis';
import {
  ListSitesInputSchema,
  SearchAnalyticsInputSchema,
  InspectUrlInputSchema,
  ListSitemapsInputSchema,
  SubmitSitemapInputSchema,
  DeleteSitemapInputSchema,
} from '../schemas/inputs.js';
import { listSites, listSitesDescription } from './list-sites.js';
import { searchAnalytics, searchAnalyticsDescription } from './search-analytics.js';
import { inspectUrl, inspectUrlDescription } from './url-inspection.js';
import {
  listSitemaps,
  listSitemapsDescription,
  submitSitemap,
  submitSitemapDescription,
  deleteSitemap,
  deleteSitemapDescription,
} from './sitemaps.js';

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
  {
    name: 'gsc.inspect_url',
    description: inspectUrlDescription,
    inputSchema: zodToJsonSchema(InspectUrlInputSchema),
  },
  {
    name: 'gsc.list_sitemaps',
    description: listSitemapsDescription,
    inputSchema: zodToJsonSchema(ListSitemapsInputSchema),
  },
  {
    name: 'gsc.submit_sitemap',
    description: submitSitemapDescription,
    inputSchema: zodToJsonSchema(SubmitSitemapInputSchema),
  },
  {
    name: 'gsc.delete_sitemap',
    description: deleteSitemapDescription,
    inputSchema: zodToJsonSchema(DeleteSitemapInputSchema),
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

    case 'gsc.inspect_url': {
      const input = InspectUrlInputSchema.parse(args);
      return inspectUrl(searchConsole, input);
    }

    case 'gsc.list_sitemaps': {
      const input = ListSitemapsInputSchema.parse(args);
      return listSitemaps(searchConsole, input);
    }

    case 'gsc.submit_sitemap': {
      const input = SubmitSitemapInputSchema.parse(args);
      return submitSitemap(searchConsole, input);
    }

    case 'gsc.delete_sitemap': {
      const input = DeleteSitemapInputSchema.parse(args);
      return deleteSitemap(searchConsole, input);
    }

    default:
      return `Unknown tool: ${toolName}`;
  }
}

export { listSites } from './list-sites.js';
export { searchAnalytics } from './search-analytics.js';
export { inspectUrl } from './url-inspection.js';
export { listSitemaps, submitSitemap, deleteSitemap } from './sitemaps.js';
