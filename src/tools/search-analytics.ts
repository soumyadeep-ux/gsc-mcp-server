import type { searchconsole_v1 } from 'googleapis';
import type { SearchAnalyticsInput, DimensionFilter } from '../schemas/inputs.js';
import { formatAnalyticsTable } from '../utils/format.js';
import { formatToolError } from '../utils/errors.js';
import { parseDateRange } from '../utils/date.js';
import { logger } from '../utils/logger.js';

export const searchAnalyticsDescription =
  'Query Google Search Console search analytics data including clicks, impressions, CTR, and position';

/**
 * Converts our filter format to GSC API format
 */
function convertFilters(
  filters?: DimensionFilter[]
): searchconsole_v1.Schema$ApiDimensionFilterGroup[] | undefined {
  if (!filters || filters.length === 0) {
    return undefined;
  }

  return [
    {
      groupType: 'and',
      filters: filters.map((f) => ({
        dimension: f.dimension.toUpperCase(),
        operator: f.operator,
        expression: f.expression,
      })),
    },
  ];
}

/**
 * Queries GSC search analytics data
 */
export async function searchAnalytics(
  searchConsole: searchconsole_v1.Searchconsole,
  input: SearchAnalyticsInput
): Promise<string> {
  logger.debug('Executing search_analytics tool', { siteUrl: input.siteUrl });

  // Pass days parameter for server-side date calculation (prevents LLM training data issues)
  const { startDate, endDate } = parseDateRange(input.startDate, input.endDate, input.days);
  const dimensions = input.dimensions ?? ['query'];
  const rowLimit = input.rowLimit ?? 1000; // Increased from 100 for more comprehensive data
  const startRow = input.startRow ?? 0;
  const searchType = input.searchType ?? 'web';

  // Check if page dimension is used (affects aggregationType)
  const hasPageDimension = dimensions.some((d) => d.toLowerCase() === 'page');

  try {
    const request: searchconsole_v1.Schema$SearchAnalyticsQueryRequest = {
      startDate,
      endDate,
      dimensions: dimensions.map((d) => d.toUpperCase()),
      rowLimit,
      startRow,
      type: searchType.toUpperCase(),
      dimensionFilterGroups: convertFilters(input.filters),
      // dataState: 'all' includes fresh/unfinalized data (matches GSC dashboard behavior)
      dataState: 'all',
      // aggregationType: 'byProperty' aggregates URL variants (www/non-www), but cannot be used with page dimension
      ...(hasPageDimension ? {} : { aggregationType: 'byProperty' }),
    };

    logger.debug('Search analytics request', request);

    const response = await searchConsole.searchanalytics.query({
      siteUrl: input.siteUrl,
      requestBody: request,
    });

    const rows = response.data.rows ?? [];

    logger.debug(`Search analytics returned ${rows.length} rows`);

    // Build output header
    let output = `Search Analytics for ${input.siteUrl}\n`;
    output += `Period: ${startDate} to ${endDate}\n`;
    output += `Dimensions: ${dimensions.join(', ')}\n`;
    if (input.filters?.length) {
      output += `Filters: ${input.filters.map((f) => `${f.dimension} ${f.operator} "${f.expression}"`).join(', ')}\n`;
    }
    output += `\n`;

    // Format data table
    output += formatAnalyticsTable(
      rows.map((row) => ({
        keys: row.keys ?? undefined,
        clicks: row.clicks ?? undefined,
        impressions: row.impressions ?? undefined,
        ctr: row.ctr ?? undefined,
        position: row.position ?? undefined,
      })),
      dimensions
    );

    // Add summary
    if (rows.length > 0) {
      const totalClicks = rows.reduce((sum, r) => sum + (r.clicks ?? 0), 0);
      const totalImpressions = rows.reduce((sum, r) => sum + (r.impressions ?? 0), 0);
      const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
      const avgPosition =
        rows.reduce((sum, r) => sum + (r.position ?? 0), 0) / rows.length;

      output += `\n--- Summary ---\n`;
      output += `Total Clicks: ${totalClicks.toLocaleString()}\n`;
      output += `Total Impressions: ${totalImpressions.toLocaleString()}\n`;
      output += `Average CTR: ${(avgCtr * 100).toFixed(2)}%\n`;
      output += `Average Position: ${avgPosition.toFixed(1)}\n`;
      output += `Rows Returned: ${rows.length}${rows.length === rowLimit ? ' (limit reached)' : ''}\n`;
    }

    return output;
  } catch (error) {
    logger.error('Error querying search analytics', error);
    return formatToolError(error);
  }
}
