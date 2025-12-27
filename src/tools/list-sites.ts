import type { searchconsole_v1 } from 'googleapis';
import { formatSitesList } from '../utils/format.js';
import { formatToolError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export const listSitesDescription = 'List all Google Search Console properties you have access to';

/**
 * Lists all GSC properties the authenticated user has access to
 */
export async function listSites(
  searchConsole: searchconsole_v1.Searchconsole
): Promise<string> {
  logger.debug('Executing list_sites tool');

  try {
    const response = await searchConsole.sites.list();
    const sites = response.data.siteEntry ?? [];

    logger.debug(`Found ${sites.length} sites`);

    return formatSitesList(
      sites.map((site) => ({
        siteUrl: site.siteUrl,
        permissionLevel: site.permissionLevel,
      }))
    );
  } catch (error) {
    logger.error('Error listing sites', error);
    return formatToolError(error);
  }
}
