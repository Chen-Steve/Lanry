import { google } from 'googleapis';

/**
 * Shape of the analytics data returned for each novel.
 */
export interface AnalyticsData {
  novelId: string;
  title: string;
  pageViews: number;
  uniquePageViews: number;
  averageSessionDuration: number;
}

// Initialize the Analytics Data API client
const analyticsData = google.analyticsdata('v1beta');

/**
 * Fetches GA4 metrics for a list of novel IDs, filtering by pagePath = `/novel/[id]`.
 *
 * @param novelIds   Array of novel UUIDs
 * @param startDate  GA4-compatible start date (e.g. '30daysAgo' or '2025-07-01')
 * @param endDate    GA4-compatible end date (e.g. 'today' or '2025-07-22')
 */
export async function getNovelAnalytics(
  novelIds: string[],
  startDate: string,
  endDate: string
): Promise<AnalyticsData[]> {
  // Authorize using JWT service account via named options
  const jwt = new google.auth.JWT({
    email: process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL!,
    key: process.env.GOOGLE_ANALYTICS_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });
  await jwt.authorize();

  // ---------------------------------------------
  // Build an OR filter that matches any path that
  // starts with /novels/<slug>. This captures both
  // the novel root page and all chapter pages.
  // ---------------------------------------------
  const orExpressions = novelIds.map((slug) => ({
    filter: {
      fieldName: 'pagePath',
      stringFilter: {
        value: `/novels/${slug}`,
        matchType: 'BEGINS_WITH',
      },
    },
  }));

  const response = await analyticsData.properties.runReport({
    property: process.env.GOOGLE_ANALYTICS_PROPERTY_ID!,
    auth: jwt,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'pagePath' },
        { name: 'pageTitle' },
      ],
      metrics: [
        { name: 'screenPageViews' }, // total page views
        { name: 'activeUsers' }, // unique users
        { name: 'averageSessionDuration' }, // avg session duration
      ],
      dimensionFilter: {
        orGroup: { expressions: orExpressions },
      },
      limit: '100000', // high enough to include all pages (string per GA spec)
    },
  });

  interface Row {
    dimensionValues?: { value?: string }[];
    metricValues?: { value?: string }[];
  }

  const rows: Row[] = (response as { data: { rows?: Row[] } }).data.rows || [];

  // ---------------------------------------------
  // Aggregate rows by slug so root + chapter pages
  // are summed together.
  // ---------------------------------------------
  type Accum = {
    slug: string;
    title: string;
    pageViews: number;
    uniquePageViews: number;
    sessionDurationSum: number; // for weighted average
  };

  const aggregates: Record<string, Accum> = {};

  rows.forEach((row) => {
    const path = row.dimensionValues?.[0].value || '';
    const title = row.dimensionValues?.[1].value || path;
    const slug = path.split('/')[2] || '';

    if (!slug) return;
    if (!aggregates[slug]) {
      aggregates[slug] = {
        slug,
        title,
        pageViews: 0,
        uniquePageViews: 0,
        sessionDurationSum: 0,
      };
    }

    const pageViews = Number(row.metricValues?.[0].value || 0);
    const uniquePageViews = Number(row.metricValues?.[1].value || 0);
    const avgSessionDuration = Number(row.metricValues?.[2].value || 0);

    aggregates[slug].pageViews += pageViews;
    aggregates[slug].uniquePageViews += uniquePageViews;
    aggregates[slug].sessionDurationSum += avgSessionDuration * pageViews; // weight by views
  });

  // Convert to desired output format
  return Object.values(aggregates).map((acc) => {
    const averageSessionDuration =
      acc.pageViews > 0 ? acc.sessionDurationSum / acc.pageViews : 0;
    return {
      novelId: acc.slug,
      title: acc.title,
      pageViews: acc.pageViews,
      uniquePageViews: acc.uniquePageViews,
      averageSessionDuration,
    } as AnalyticsData;
  });
}
