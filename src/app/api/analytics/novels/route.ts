import { NextRequest, NextResponse } from 'next/server';
import { getNovelAnalytics } from '@/services/googleAnalyticsService';

// Disable static rendering because we rely on per-request query params
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const novelIdsParam = searchParams.get('novelIds');
  const startDate = searchParams.get('startDate') || '30daysAgo';
  const endDate = searchParams.get('endDate') || 'today';

  if (!novelIdsParam) {
    return NextResponse.json({ error: 'Novel IDs are required' }, { status: 400 });
  }

  const novelIds = novelIdsParam
    .split(',')
    .map(id => id.trim())
    .filter(Boolean);

  if (novelIds.length === 0) {
    return NextResponse.json({ error: 'No valid novel IDs provided' }, { status: 400 });
  }

  // Attempt to fetch from Google Analytics
  try {
    const analyticsData = await getNovelAnalytics(novelIds, startDate, endDate);
    return NextResponse.json(
      { success: true, data: analyticsData, source: 'google_analytics' },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error fetching analytics data:', message);
    return NextResponse.json(
      { error: 'Failed to fetch Google Analytics data' },
      { status: 500 }
    );
  }
}
