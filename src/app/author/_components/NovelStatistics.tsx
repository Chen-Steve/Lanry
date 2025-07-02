'use client';

import { useState, useEffect, useCallback } from 'react';
import supabase from '@/lib/supabaseClient';
import { Icon } from '@iconify/react';

interface NovelStats {
  id: string;
  title: string;
  bookmarks: number;
  total_chapters: number;
  total_comments: number;
  total_views: number;
  ga_views?: number; // Google Analytics views
  data_source?: 'google_analytics' | 'database_fallback';
}

// First, let's define the interface for the raw data from Supabase
interface NovelData {
  id: string;
  title: string;
  bookmark_count: number;
  views: number;
  chapters_count: { count: number; }[];
  chapter_comments_count: { count: number; }[];
  novel_comments_count: { count: number; }[];
  chapters_thread_comments: { chapter_thread_comments: { count: number; }[]; }[];
}

interface AnalyticsData {
  novelId: string;
  title: string;
  pageViews: number;
  uniquePageViews: number;
  averageSessionDuration: number;
}

export default function NovelStatistics() {
  const [stats, setStats] = useState<NovelStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNovel, setSelectedNovel] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<string>('30daysAgo');
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) return;

    const { data, error } = await supabase
      .from('novels')
      .select(`
        id,
        title,
        bookmark_count,
        views,
        chapters_count:chapters(count),
        chapter_comments_count:chapter_comments(count),
        novel_comments_count:novel_comments(count),
        chapters_thread_comments:chapters(chapter_thread_comments(count))
      `)
      .or(`author_profile_id.eq.${session.user.id},translator_id.eq.${session.user.id}`);

    if (error) {
      console.error('Error fetching stats:', error);
      return;
    }

    const novelData = data as NovelData[];
    const novelIds = novelData.map(novel => novel.id);

    // Fetch Google Analytics data
    let analyticsData: AnalyticsData[] = [];
    let dataSource: 'google_analytics' | 'database_fallback' = 'database_fallback';
    
    try {
      const analyticsResponse = await fetch(`/api/analytics/novels?novelIds=${novelIds.join(',')}&startDate=${timePeriod}&endDate=today`);
      if (analyticsResponse.ok) {
        const analyticsResult = await analyticsResponse.json();
        if (analyticsResult.success) {
          analyticsData = analyticsResult.data;
          dataSource = analyticsResult.source;
          setAnalyticsError(null);
        } else {
          setAnalyticsError(analyticsResult.note || 'Failed to fetch analytics data');
        }
      } else {
        setAnalyticsError('Analytics service unavailable');
      }
    } catch (error) {
      console.warn('Failed to fetch Google Analytics data:', error);
      setAnalyticsError('Failed to connect to analytics service');
    }

    const formattedStats = novelData.map(novel => {
      // Calculate total thread comments by summing up counts from each chapter
      const totalThreadComments = novel.chapters_thread_comments.reduce((sum, chapter) => {
        return sum + (chapter.chapter_thread_comments[0]?.count || 0);
      }, 0);

      // Find corresponding analytics data
      const analyticsEntry = analyticsData.find(entry => entry.novelId === novel.id);
      const gaViews = analyticsEntry?.pageViews || 0;

      return {
        id: novel.id,
        title: novel.title,
        bookmarks: novel.bookmark_count,
        total_chapters: novel.chapters_count[0]?.count || 0,
        total_comments: (novel.chapter_comments_count[0]?.count || 0) + 
                       (novel.novel_comments_count[0]?.count || 0) + 
                       totalThreadComments,
        total_views: gaViews > 0 ? gaViews : (novel.views || 0), // Prefer GA data
        ga_views: gaViews,
        data_source: dataSource
      };
    });

    setStats(formattedStats);
    if (formattedStats.length > 0 && !selectedNovel) {
      setSelectedNovel(formattedStats[0].id);
    }
    setIsLoading(false);
  }, [selectedNovel, timePeriod]);

  const handleNovelClick = async (novelId: string) => {
    setSelectedNovel(novelId);
  };

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (isLoading) {
    return (
      <section aria-busy="true" className="flex justify-center p-4">
        <Icon icon="mdi:loading" className="animate-spin text-4xl text-primary/60" />
      </section>
    );
  }

  return (
    <section className="p-4">      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-foreground">Novel Statistics</h2>
        <div className="text-right">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center gap-2">
              <label htmlFor="time-period" className="text-sm text-muted-foreground">
                Time Period:
              </label>
              <select
                id="time-period"
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value)}
                className="px-3 py-1 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="7daysAgo">Last 7 days</option>
                <option value="30daysAgo">Last 30 days</option>
                <option value="90daysAgo">Last 3 months</option>
                <option value="365daysAgo">Last year</option>
              </select>
            </div>
            <button
              onClick={() => {
                setIsLoading(true);
                fetchStats();
              }}
              disabled={isLoading}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <Icon icon={isLoading ? "mdi:loading" : "mdi:refresh"} className={`text-sm ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          <p className="text-sm text-muted-foreground italic">
            {stats.length > 0 && stats[0].data_source === 'google_analytics' 
              ? 'Views from Google Analytics' 
              : stats.length > 0 && stats[0].data_source === 'database_fallback'
              ? 'Views from database (GA unavailable)'
              : 'View counts may be lower than actual'
            }
          </p>
          {stats.length > 0 && stats[0].data_source === 'google_analytics' && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center justify-end gap-1">
              <Icon icon="mdi:google-analytics" className="text-sm" />
              Google Analytics Active
            </p>
          )}
          {analyticsError && (
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 flex items-center justify-end gap-1">
              <Icon icon="mdi:alert-circle-outline" className="text-sm" />
              {analyticsError}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="bg-background border border-border rounded-lg shadow-sm">
          {stats.map((novel, index) => (
            <div 
              key={novel.id}
              className={`flex items-center gap-4 p-3 hover:bg-muted/50 transition-colors cursor-pointer ${
                selectedNovel === novel.id ? 'bg-muted' : ''
              } ${index !== 0 ? 'border-t border-border' : ''}`}
              onClick={() => handleNovelClick(novel.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium line-clamp-1 text-foreground">{novel.title}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Icon icon="pepicons-print:book" className="text-sm" />
                    <span>{novel.total_chapters}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-1.5">
                  <Icon icon="mdi:bookmark-outline" className="text-muted-foreground" />
                  <span className="text-sm font-medium">{novel.bookmarks}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Icon icon="mdi:comment-outline" className="text-muted-foreground" />
                  <span className="text-sm font-medium">{novel.total_comments}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Icon icon="mdi:eye-outline" className="text-muted-foreground" />
                  <span className="text-sm font-medium">{novel.total_views}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 