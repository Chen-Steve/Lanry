import { BetaAnalyticsDataClient } from '@google-analytics/data';

// Google Analytics property ID - this needs to be obtained from GA4 Admin > Property Settings
// The property ID is different from the measurement ID (G-PVZ6V89JEJ)
const GA_PROPERTY_ID = process.env.GOOGLE_ANALYTICS_PROPERTY_ID || 'properties/YOUR_PROPERTY_ID_HERE';

// Initialize the analytics client
let analyticsDataClient: BetaAnalyticsDataClient | null = null;

function getAnalyticsClient() {
  if (!analyticsDataClient) {
    try {
      // Check if we have the required environment variables
      const credentials = {
        client_email: process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_ANALYTICS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        project_id: process.env.GOOGLE_ANALYTICS_PROJECT_ID,
      };

      if (!credentials.client_email || !credentials.private_key || !credentials.project_id) {
        console.warn('Google Analytics credentials not configured. Set GOOGLE_ANALYTICS_CLIENT_EMAIL, GOOGLE_ANALYTICS_PRIVATE_KEY, and GOOGLE_ANALYTICS_PROJECT_ID environment variables.');
        return null;
      }

      analyticsDataClient = new BetaAnalyticsDataClient({
        credentials,
        projectId: credentials.project_id,
      });
    } catch (error) {
      console.error('Failed to initialize Google Analytics client:', error);
      return null;
    }
  }
  return analyticsDataClient;
}

export interface NovelAnalyticsData {
  novelId: string;
  title: string;
  pageViews: number;
  uniquePageViews: number;
  averageSessionDuration: number;
}

export async function getNovelAnalytics(
  novelIds: string[],
  startDate: string = '30daysAgo',
  endDate: string = 'today'
): Promise<NovelAnalyticsData[]> {
  const client = getAnalyticsClient();
  
  if (!client) {
    console.warn('Google Analytics client not available, returning empty data');
    return [];
  }

  try {
    // Create dimension filters for specific novel pages
    const dimensionFilter = {
      filter: {
        fieldName: 'pagePath',
        stringFilter: {
          matchType: 'CONTAINS' as const,
          value: '/novels/',
        },
      },
    };

    const [response] = await client.runReport({
      property: GA_PROPERTY_ID,
      dateRanges: [
        {
          startDate,
          endDate,
        },
      ],
      dimensions: [
        {
          name: 'pagePath',
        },
        {
          name: 'pageTitle',
        },
      ],
      metrics: [
        {
          name: 'screenPageViews',
        },
        {
          name: 'totalUsers',
        },
        {
          name: 'averageSessionDuration',
        },
      ],
      dimensionFilter,
      limit: 1000,
    });

    const analyticsData: NovelAnalyticsData[] = [];

    if (response.rows) {
      for (const row of response.rows) {
        const pagePath = row.dimensionValues?.[0]?.value || '';
        const pageTitle = row.dimensionValues?.[1]?.value || '';
        const pageViews = parseInt(row.metricValues?.[0]?.value || '0');
        const uniquePageViews = parseInt(row.metricValues?.[1]?.value || '0');
        const avgSessionDuration = parseFloat(row.metricValues?.[2]?.value || '0');

        // Extract novel ID from the page path (e.g., /novels/123 -> 123)
        const novelIdMatch = pagePath.match(/\/novels\/([^\/\?]+)/);
        if (novelIdMatch) {
          const novelId = novelIdMatch[1];
          
          // Only include novels that are in our requested list
          if (novelIds.includes(novelId)) {
            const existingData = analyticsData.find(d => d.novelId === novelId);
            
            if (existingData) {
              // Aggregate data if we have multiple entries for the same novel
              existingData.pageViews += pageViews;
              existingData.uniquePageViews += uniquePageViews;
              existingData.averageSessionDuration = 
                (existingData.averageSessionDuration + avgSessionDuration) / 2;
            } else {
              analyticsData.push({
                novelId,
                title: pageTitle || `Novel ${novelId}`,
                pageViews,
                uniquePageViews,
                averageSessionDuration: avgSessionDuration,
              });
            }
          }
        }
      }
    }

    return analyticsData;
  } catch (error) {
    console.error('Error fetching Google Analytics data:', error);
    return [];
  }
}

export async function getNovelPageViews(novelId: string, days: number = 30): Promise<number> {
  const startDate = `${days}daysAgo`;
  const analyticsData = await getNovelAnalytics([novelId], startDate);
  
  return analyticsData.find(data => data.novelId === novelId)?.pageViews || 0;
} 