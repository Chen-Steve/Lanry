'use client';

import { useState, useEffect } from 'react';
import supabase from '@/lib/supabaseClient';
import { Icon } from '@iconify/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface NovelStats {
  id: string;
  title: string;
  bookmarks: number;
  total_chapters: number;
  total_comments: number;
  views: number;
  monthly_views: number;
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

// Define colors for the pie chart
const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#6366F1'];

export default function NovelStatistics() {
  const [stats, setStats] = useState<NovelStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNovel, setSelectedNovel] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'total' | 'monthly'>('monthly');

  const fetchStats = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) return;

    // Get the start of the current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

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
      .eq('author_profile_id', session.user.id);

    if (error) {
      console.error('Error fetching stats:', error);
      return;
    }

    // Get monthly views for each novel
    const monthlyViewsPromises = data.map(async (novel) => {
      try {
        console.log('Calling get_novel_monthly_views with:', {
          input_novel_id: novel.id,
          start_date: startOfMonth.toISOString()
        });

        const { data: monthViews, error: rpcError } = await supabase
          .rpc('get_novel_monthly_views', { 
            input_novel_id: novel.id,
            start_date: startOfMonth.toISOString()
          });

        if (rpcError) {
          console.error('RPC Error for novel', novel.id, ':', rpcError);
          // Fall back to using view_logs if available
          const { data: viewLogs, error: viewLogsError } = await supabase
            .from('novel_view_logs')
            .select('created_at')
            .eq('novel_id', novel.id)
            .gte('created_at', startOfMonth.toISOString());

          if (!viewLogsError && viewLogs) {
            return { id: novel.id, monthly_views: viewLogs.length };
          }
          return { id: novel.id, monthly_views: 0 };
        }

        console.log('Monthly views result for novel', novel.id, ':', monthViews);
        return { id: novel.id, monthly_views: monthViews || 0 };
      } catch (error) {
        console.error('Error getting monthly views for novel', novel.id, ':', error);
        return { id: novel.id, monthly_views: 0 };
      }
    });

    const monthlyViewsResults = await Promise.all(monthlyViewsPromises);

    const formattedStats = (data as NovelData[]).map(novel => {
      // Calculate total thread comments by summing up counts from each chapter
      const totalThreadComments = novel.chapters_thread_comments.reduce((sum, chapter) => {
        return sum + (chapter.chapter_thread_comments[0]?.count || 0);
      }, 0);

      // Get monthly views for this novel
      const monthlyViews = monthlyViewsResults.find(mv => mv.id === novel.id)?.monthly_views || 0;

      return {
        id: novel.id,
        title: novel.title,
        bookmarks: novel.bookmark_count,
        views: novel.views || 0,
        monthly_views: monthlyViews,
        total_chapters: novel.chapters_count[0]?.count || 0,
        total_comments: (novel.chapter_comments_count[0]?.count || 0) + 
                       (novel.novel_comments_count[0]?.count || 0) + 
                       totalThreadComments
      };
    });

    setStats(formattedStats);
    if (formattedStats.length > 0 && !selectedNovel) {
      setSelectedNovel(formattedStats[0].id);
    }
    setIsLoading(false);
  };

  const handleNovelClick = async (novelId: string) => {
    setSelectedNovel(novelId);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <section aria-busy="true" className="flex justify-center p-4">
        <Icon icon="mdi:loading" className="animate-spin text-4xl text-primary/60" />
      </section>
    );
  }

  const monthlyViewsData = stats.map(novel => ({
    name: novel.title,
    value: novel.monthly_views
  }));

  const totalViewsData = stats.map(novel => ({
    name: novel.title,
    value: novel.views
  }));

  return (
    <section className="p-4">      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-foreground">Novel Statistics</h2>
        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
          <button
            onClick={() => setViewType('total')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewType === 'total' 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'hover:bg-muted text-muted-foreground'
            }`}
          >
            Total Views
          </button>
          <button
            onClick={() => setViewType('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewType === 'monthly' 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'hover:bg-muted text-muted-foreground'
            }`}
          >
            Monthly Views
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="bg-background border border-border rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-foreground">
            {viewType === 'monthly' ? 'Monthly Views Distribution' : 'Total Views Distribution'}
          </h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={viewType === 'monthly' ? monthlyViewsData : totalViewsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={150}
                  fill="#8884d8"
                  dataKey="value"
                  label={({
                    cx,
                    cy,
                    midAngle,
                    innerRadius,
                    outerRadius,
                    value
                  }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = 25 + innerRadius + (outerRadius - innerRadius);
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    const percent = ((value / (viewType === 'monthly' ? 
                      monthlyViewsData.reduce((a, b) => a + b.value, 0) : 
                      totalViewsData.reduce((a, b) => a + b.value, 0))) * 100).toFixed(1);

                    return value > 0 ? (
                      <text
                        x={x}
                        y={y}
                        fill="var(--foreground)"
                        textAnchor={x > cx ? 'start' : 'end'}
                        dominantBaseline="central"
                        className="text-xs font-medium"
                      >
                        {`${percent}%`}
                      </text>
                    ) : null;
                  }}
                >
                  {(viewType === 'monthly' ? monthlyViewsData : totalViewsData).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [
                    <span key="tooltip-text" className="text-foreground dark:text-white">
                      {`${value.toLocaleString()} views`}
                    </span>, 
                    ''
                  ]}
                  contentStyle={{
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '8px 12px'
                  }}
                />
                <Legend 
                  formatter={(value) => (
                    <span style={{ color: 'var(--foreground)' }}>{value}</span>
                  )}
                  wrapperStyle={{
                    paddingTop: '20px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

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
                  <span className="text-sm font-medium">
                    {viewType === 'monthly' ? novel.monthly_views : novel.views}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 