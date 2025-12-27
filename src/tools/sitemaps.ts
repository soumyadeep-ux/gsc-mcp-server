import type { searchconsole_v1 } from 'googleapis';
import type { ListSitemapsInput, SubmitSitemapInput, DeleteSitemapInput } from '../schemas/inputs.js';
import { formatToolError } from '../utils/errors.js';
import { formatNumber, tableRow, tableSeparator } from '../utils/format.js';
import { logger } from '../utils/logger.js';

export const listSitemapsDescription =
  'List all sitemaps submitted to Google Search Console for a site';

export const submitSitemapDescription =
  'Submit a new sitemap to Google Search Console';

export const deleteSitemapDescription =
  'Delete a sitemap from Google Search Console';

/**
 * Formats sitemap data into a readable table
 */
function formatSitemapsList(
  siteUrl: string,
  sitemaps: searchconsole_v1.Schema$WmxSitemap[]
): string {
  if (sitemaps.length === 0) {
    return `No sitemaps found for ${siteUrl}`;
  }

  let output = `Sitemaps for ${siteUrl}\n`;
  output += `${'='.repeat(50)}\n\n`;
  output += `Found ${sitemaps.length} sitemap${sitemaps.length === 1 ? '' : 's'}:\n\n`;

  const headers = ['Sitemap URL', 'Type', 'Submitted', 'Last Downloaded', 'Warnings', 'Errors'];
  const widths = [50, 12, 12, 16, 10, 10];

  output += tableRow(headers, widths) + '\n';
  output += tableSeparator(widths) + '\n';

  for (const sitemap of sitemaps) {
    const submitted = sitemap.lastSubmitted
      ? new Date(sitemap.lastSubmitted).toLocaleDateString()
      : 'N/A';
    const downloaded = sitemap.lastDownloaded
      ? new Date(sitemap.lastDownloaded).toLocaleDateString()
      : 'N/A';

    output += tableRow(
      [
        sitemap.path ?? 'Unknown',
        sitemap.type ?? 'Unknown',
        submitted,
        downloaded,
        formatNumber(Number(sitemap.warnings) || 0),
        formatNumber(Number(sitemap.errors) || 0),
      ],
      widths
    ) + '\n';

    // Show content details if available
    if (sitemap.contents && sitemap.contents.length > 0) {
      for (const content of sitemap.contents) {
        output += `    └─ ${content.type}: ${formatNumber(Number(content.submitted) || 0)} submitted, ${formatNumber(Number(content.indexed) || 0)} indexed\n`;
      }
    }
  }

  return output;
}

/**
 * Lists all sitemaps for a site
 */
export async function listSitemaps(
  searchConsole: searchconsole_v1.Searchconsole,
  input: ListSitemapsInput
): Promise<string> {
  logger.debug('Executing list_sitemaps tool', { siteUrl: input.siteUrl });

  try {
    const response = await searchConsole.sitemaps.list({
      siteUrl: input.siteUrl,
    });

    const sitemaps = response.data.sitemap ?? [];
    logger.debug(`Found ${sitemaps.length} sitemaps`);

    return formatSitemapsList(input.siteUrl, sitemaps);
  } catch (error) {
    logger.error('Error listing sitemaps', error);
    return formatToolError(error);
  }
}

/**
 * Submits a new sitemap
 */
export async function submitSitemap(
  searchConsole: searchconsole_v1.Searchconsole,
  input: SubmitSitemapInput
): Promise<string> {
  logger.debug('Executing submit_sitemap tool', {
    siteUrl: input.siteUrl,
    sitemapUrl: input.sitemapUrl,
  });

  try {
    await searchConsole.sitemaps.submit({
      siteUrl: input.siteUrl,
      feedpath: input.sitemapUrl,
    });

    logger.debug('Sitemap submitted successfully');

    return `Successfully submitted sitemap: ${input.sitemapUrl}\n\n` +
      `The sitemap has been added to Google Search Console for ${input.siteUrl}.\n` +
      `Google will process it shortly. Use 'gsc.list_sitemaps' to check the status.`;
  } catch (error) {
    logger.error('Error submitting sitemap', error);
    return formatToolError(error);
  }
}

/**
 * Deletes a sitemap
 */
export async function deleteSitemap(
  searchConsole: searchconsole_v1.Searchconsole,
  input: DeleteSitemapInput
): Promise<string> {
  logger.debug('Executing delete_sitemap tool', {
    siteUrl: input.siteUrl,
    sitemapUrl: input.sitemapUrl,
  });

  try {
    await searchConsole.sitemaps.delete({
      siteUrl: input.siteUrl,
      feedpath: input.sitemapUrl,
    });

    logger.debug('Sitemap deleted successfully');

    return `Successfully deleted sitemap: ${input.sitemapUrl}\n\n` +
      `The sitemap has been removed from Google Search Console for ${input.siteUrl}.`;
  } catch (error) {
    logger.error('Error deleting sitemap', error);
    return formatToolError(error);
  }
}
