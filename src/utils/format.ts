/**
 * Formats a number with commas for readability
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Formats a percentage with specified decimals
 */
export function formatPercent(value: number, decimals = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Formats a position value
 */
export function formatPosition(position: number): string {
  return position.toFixed(1);
}

/**
 * Creates a table row for text output
 */
export function tableRow(columns: string[], widths: number[]): string {
  return columns
    .map((col, i) => {
      const width = widths[i] ?? 20;
      return col.length > width ? col.slice(0, width - 3) + '...' : col.padEnd(width);
    })
    .join(' | ');
}

/**
 * Creates a separator line for tables
 */
export function tableSeparator(widths: number[]): string {
  return widths.map((w) => '-'.repeat(w)).join('-+-');
}

/**
 * Formats search analytics row data
 */
export interface AnalyticsRow {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
}

export function formatAnalyticsTable(
  rows: AnalyticsRow[],
  dimensions: string[]
): string {
  if (rows.length === 0) {
    return 'No data found for the specified criteria.';
  }

  const headers = [...dimensions, 'Clicks', 'Impressions', 'CTR', 'Position'];
  const widths = dimensions.map(() => 40);
  widths.push(10, 12, 8, 10); // Metrics widths

  let output = tableRow(headers, widths) + '\n';
  output += tableSeparator(widths) + '\n';

  for (const row of rows) {
    const keys = row.keys ?? dimensions.map(() => '(unknown)');
    const values = [
      ...keys,
      formatNumber(row.clicks ?? 0),
      formatNumber(row.impressions ?? 0),
      formatPercent(row.ctr ?? 0),
      formatPosition(row.position ?? 0),
    ];
    output += tableRow(values, widths) + '\n';
  }

  return output;
}

/**
 * Formats a list of sites
 */
export interface SiteEntry {
  siteUrl?: string | null;
  permissionLevel?: string | null;
}

export function formatSitesList(sites: SiteEntry[]): string {
  if (sites.length === 0) {
    return 'No Search Console properties found.';
  }

  let output = `Found ${sites.length} Search Console ${sites.length === 1 ? 'property' : 'properties'}:\n\n`;

  const headers = ['Site URL', 'Permission'];
  const widths = [50, 20];

  output += tableRow(headers, widths) + '\n';
  output += tableSeparator(widths) + '\n';

  for (const site of sites) {
    output += tableRow([site.siteUrl ?? '', site.permissionLevel ?? ''], widths) + '\n';
  }

  return output;
}
