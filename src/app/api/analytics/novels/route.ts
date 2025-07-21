import { NextRequest, NextResponse } from 'next/server';
import { getNovelAnalytics } from '@/services/googleAnalyticsService';
import { createServerClient } from '@/lib/supabaseServer';

// This route relies on per-request query params, so we disable static rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const novelIdsParam = searchParams.get('novelIds');
    const startDate = searchParams.get('startDate') || '30daysAgo';
    const endDate = searchParams.get('endDate') || 'today';

    if (!novelIdsParam) {
      return NextResponse.json(
        { error: 'Novel IDs are required' },
        { status: 400 }
      );
    }

    const novelIds = novelIdsParam.split(',');

    // Get analytics data from Google Analytics
    const analyticsData = await getNovelAnalytics(novelIds, startDate, endDate);

    return NextResponse.json({
      success: true,
      data: analyticsData,
      source: 'google_analytics'
    });

  } catch (error) {
    console.error('Error fetching analytics data:', error);
    
    // Fallback to database views if GA fails
    const supabase = createServerClient();
    try {
      const { searchParams } = new URL(request.url);
      const novelIdsParam = searchParams.get('novelIds');
      
      if (novelIdsParam) {
        const novelIds = novelIdsParam.split(',');
        
        const { data: novels, error: dbError } = await supabase
          .from('novels')
          .select('id, title, views')
          .in('id', novelIds);

        if (dbError) throw dbError;

        const fallbackData = novels?.map((novel: { id: string; title: string; views: number | null }) => ({
          novelId: novel.id,
          title: novel.title,
          pageViews: novel.views || 0,
          uniquePageViews: novel.views || 0,
          averageSessionDuration: 0
        })) || [];

        return NextResponse.json({
          success: true,
          data: fallbackData,
          source: 'database_fallback',
          note: 'Google Analytics data unavailable, using database views'
        });
      }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
    }

    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
} 