import type { searchconsole_v1 } from 'googleapis';
import type { InspectUrlInput } from '../schemas/inputs.js';
import { formatToolError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export const inspectUrlDescription =
  'Inspect a URL to check its indexing status, crawl info, and mobile usability in Google Search';

/**
 * Formats the URL inspection result into a readable string
 */
function formatInspectionResult(
  url: string,
  result: searchconsole_v1.Schema$InspectUrlIndexResponse
): string {
  const inspection = result.inspectionResult;
  if (!inspection) {
    return `No inspection data available for ${url}`;
  }

  let output = `URL Inspection Report\n`;
  output += `${'='.repeat(50)}\n\n`;
  output += `URL: ${url}\n\n`;

  // Index Status
  const indexStatus = inspection.indexStatusResult;
  if (indexStatus) {
    output += `## Indexing Status\n`;
    output += `Coverage State: ${indexStatus.coverageState ?? 'Unknown'}\n`;
    output += `Indexing State: ${indexStatus.indexingState ?? 'Unknown'}\n`;

    if (indexStatus.lastCrawlTime) {
      output += `Last Crawl: ${indexStatus.lastCrawlTime}\n`;
    }
    if (indexStatus.pageFetchState) {
      output += `Page Fetch: ${indexStatus.pageFetchState}\n`;
    }
    if (indexStatus.googleCanonical) {
      output += `Google Canonical: ${indexStatus.googleCanonical}\n`;
    }
    if (indexStatus.userCanonical) {
      output += `User Canonical: ${indexStatus.userCanonical}\n`;
    }
    if (indexStatus.robotsTxtState) {
      output += `Robots.txt: ${indexStatus.robotsTxtState}\n`;
    }
    if (indexStatus.verdict) {
      output += `Verdict: ${indexStatus.verdict}\n`;
    }
    output += '\n';
  }

  // Mobile Usability
  const mobileUsability = inspection.mobileUsabilityResult;
  if (mobileUsability) {
    output += `## Mobile Usability\n`;
    output += `Verdict: ${mobileUsability.verdict ?? 'Unknown'}\n`;

    if (mobileUsability.issues && mobileUsability.issues.length > 0) {
      output += `Issues:\n`;
      for (const issue of mobileUsability.issues) {
        output += `  - ${issue.issueType}: ${issue.message ?? 'No details'}\n`;
      }
    } else {
      output += `No mobile usability issues found.\n`;
    }
    output += '\n';
  }

  // Rich Results
  const richResults = inspection.richResultsResult;
  if (richResults) {
    output += `## Rich Results\n`;
    output += `Verdict: ${richResults.verdict ?? 'Unknown'}\n`;

    if (richResults.detectedItems && richResults.detectedItems.length > 0) {
      output += `Detected Items:\n`;
      for (const item of richResults.detectedItems) {
        if (item.richResultType) {
          output += `  - ${item.richResultType}\n`;
          if (item.items && item.items.length > 0) {
            for (const subItem of item.items) {
              if (subItem.issues && subItem.issues.length > 0) {
                for (const issue of subItem.issues) {
                  output += `      Issue: ${issue.issueMessage ?? 'Unknown'} (${issue.severity ?? 'unknown severity'})\n`;
                }
              }
            }
          }
        }
      }
    }
    output += '\n';
  }

  // AMP (if applicable)
  const ampResult = inspection.ampResult;
  if (ampResult) {
    output += `## AMP\n`;
    output += `Verdict: ${ampResult.verdict ?? 'Unknown'}\n`;
    if (ampResult.ampUrl) {
      output += `AMP URL: ${ampResult.ampUrl}\n`;
    }
    if (ampResult.issues && ampResult.issues.length > 0) {
      output += `Issues:\n`;
      for (const issue of ampResult.issues) {
        output += `  - ${issue.issueMessage ?? 'Unknown issue'} (${issue.severity ?? 'unknown'})\n`;
      }
    }
    output += '\n';
  }

  return output;
}

/**
 * Inspects a URL using the Google Search Console URL Inspection API
 */
export async function inspectUrl(
  searchConsole: searchconsole_v1.Searchconsole,
  input: InspectUrlInput
): Promise<string> {
  logger.debug('Executing inspect_url tool', {
    siteUrl: input.siteUrl,
    inspectionUrl: input.inspectionUrl
  });

  try {
    const response = await searchConsole.urlInspection.index.inspect({
      requestBody: {
        inspectionUrl: input.inspectionUrl,
        siteUrl: input.siteUrl,
      },
    });

    if (!response.data.inspectionResult) {
      return `No inspection data available for ${input.inspectionUrl}`;
    }

    logger.debug('URL inspection completed successfully');
    return formatInspectionResult(input.inspectionUrl, response.data);
  } catch (error) {
    logger.error('Error inspecting URL', error);
    return formatToolError(error);
  }
}
