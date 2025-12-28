import { z } from 'zod';

/**
 * Common dimension enum used across tools
 */
export const DimensionEnum = z.enum(['query', 'page', 'country', 'device', 'date']);
export type Dimension = z.infer<typeof DimensionEnum>;

/**
 * Filter operator enum
 */
export const FilterOperatorEnum = z.enum(['equals', 'contains', 'notContains', 'notEquals']);
export type FilterOperator = z.infer<typeof FilterOperatorEnum>;

/**
 * Search type enum
 */
export const SearchTypeEnum = z.enum(['web', 'image', 'video', 'news', 'discover', 'googleNews']);
export type SearchType = z.infer<typeof SearchTypeEnum>;

/**
 * Dimension filter schema
 */
export const DimensionFilterSchema = z.object({
  dimension: DimensionEnum.describe('The dimension to filter on'),
  operator: FilterOperatorEnum.describe('The comparison operator'),
  expression: z.string().describe('The value to compare against'),
});
export type DimensionFilter = z.infer<typeof DimensionFilterSchema>;

/**
 * Schema for gsc.list_sites
 * No input required
 */
export const ListSitesInputSchema = z.object({}).describe('List all GSC properties');
export type ListSitesInput = z.infer<typeof ListSitesInputSchema>;

/**
 * Schema for gsc.search_analytics
 */
export const SearchAnalyticsInputSchema = z.object({
  siteUrl: z
    .string()
    .describe(
      'GSC property URL (e.g., "sc-domain:example.com" or "https://www.example.com/")'
    ),
  days: z
    .number()
    .int()
    .min(1)
    .max(540)
    .optional()
    .describe('Number of days to look back from today (e.g., 7, 28, 90). Server calculates dates automatically. Preferred over explicit dates.'),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .describe('Optional explicit start date (YYYY-MM-DD). Overrides "days" if both provided.'),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .describe('Optional explicit end date (YYYY-MM-DD). Defaults to today.'),
  dimensions: z
    .array(DimensionEnum)
    .optional()
    .default(['query'])
    .describe('Dimensions to group by. Default: ["query"]'),
  rowLimit: z
    .number()
    .int()
    .min(1)
    .max(25000)
    .optional()
    .default(100)
    .describe('Maximum rows to return (1-25000). Default: 100'),
  startRow: z
    .number()
    .int()
    .min(0)
    .optional()
    .default(0)
    .describe('Starting row for pagination. Default: 0'),
  searchType: SearchTypeEnum.optional()
    .default('web')
    .describe('Type of search results to query. Default: "web"'),
  filters: z
    .array(DimensionFilterSchema)
    .optional()
    .describe('Optional filters to apply'),
});
export type SearchAnalyticsInput = z.infer<typeof SearchAnalyticsInputSchema>;

/**
 * Schema for gsc.inspect_url
 */
export const InspectUrlInputSchema = z.object({
  siteUrl: z
    .string()
    .describe('GSC property URL (e.g., "sc-domain:example.com")'),
  inspectionUrl: z
    .string()
    .url()
    .describe('Full URL to inspect (e.g., "https://example.com/page")'),
});
export type InspectUrlInput = z.infer<typeof InspectUrlInputSchema>;

/**
 * Schema for gsc.list_sitemaps
 */
export const ListSitemapsInputSchema = z.object({
  siteUrl: z
    .string()
    .describe('GSC property URL (e.g., "sc-domain:example.com")'),
});
export type ListSitemapsInput = z.infer<typeof ListSitemapsInputSchema>;

/**
 * Schema for gsc.submit_sitemap
 */
export const SubmitSitemapInputSchema = z.object({
  siteUrl: z
    .string()
    .describe('GSC property URL (e.g., "sc-domain:example.com")'),
  sitemapUrl: z
    .string()
    .url()
    .describe('Full URL of the sitemap to submit'),
});
export type SubmitSitemapInput = z.infer<typeof SubmitSitemapInputSchema>;

/**
 * Schema for gsc.delete_sitemap
 */
export const DeleteSitemapInputSchema = z.object({
  siteUrl: z
    .string()
    .describe('GSC property URL (e.g., "sc-domain:example.com")'),
  sitemapUrl: z
    .string()
    .url()
    .describe('Full URL of the sitemap to delete'),
});
export type DeleteSitemapInput = z.infer<typeof DeleteSitemapInputSchema>;
