"use client";

import { useState, useEffect, useCallback } from 'react';
import supabase from '@/lib/supabaseClient';
import { Icon } from '@iconify/react';
import { PieChart } from 'react-minimal-pie-chart';
import type { AnalyticsData } from '@/services/googleAnalyticsService';

// Utility to format Date object -> YYYY-MM-DD
const toISODate = (d: Date) => d.toISOString().slice(0, 10);

interface NovelStats {
  id: string;
  title: string;
  total_views: number;
  ga_views?: number;
  data_source?: 'google_analytics' | 'database_fallback';
}

interface NovelData {
  id: string;
  slug: string;
  title: string;
  views: number;
  created_at: string;
}

export default function NovelStatistics() {
  const [stats, setStats] = useState<NovelStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  // Applied date range (null values mean "all time")
  const [dateRange, setDateRange] = useState<{ start: string | null; end: string | null }>({
    start: null,
    end: null,
  });
  // Buffered inputs for Enter-to-apply
  const [startInput, setStartInput] = useState<string>('');
  const [endInput, setEndInput] = useState<string>('');

  // Hover state for pie chart
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Aggregate totals
  const [viewTotals, setViewTotals] = useState<{ today: number; month: number; all: number }>({ today: 0, month: 0, all: 0 });

  // Local (novel_view_logs) stats
  type LocalStat = { id: string; title: string; views: number };
  const [localStats, setLocalStats] = useState<LocalStat[]>([]);
  const [localTotals, setLocalTotals] = useState<{ today: number; month: number; all: number }>({ today: 0, month: 0, all: 0 });
  const [localHoverIndex, setLocalHoverIndex] = useState<number | null>(null);

  // Sync inputs if dateRange changes externally
  useEffect(() => {
    setStartInput(dateRange.start ?? '');
    setEndInput(dateRange.end ?? '');
  }, [dateRange]);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setIsLoading(false);
      return;
    }

    // Build GA query params only when provided by the user
    const urlParams = new URLSearchParams();
    // Always include the novel IDs
    // (we'll append later once we have them)

    // Fetch core stats from Supabase
    // Fetch only novels where the user is the author or translator
    const { data, error } = await supabase
      .from('novels')
      .select(`
        id,
        slug,
        title,
        views,
        created_at
      `)
      .or(`author_profile_id.eq.${session.user.id},translator_id.eq.${session.user.id}`);

    if (error) {
      console.error('Error fetching stats:', error);
      setIsLoading(false);
      return;
    }

    const novelData = data as NovelData[];
    const novelSlugs = novelData.map(n => n.slug);

    // Determine earliest creation date for dynamic "all-time" start
    const earliestCreated = novelData.reduce<string | null>((earliest, n) => {
      if (!earliest) return n.created_at;
      return new Date(n.created_at) < new Date(earliest) ? n.created_at : earliest;
    }, null);

    // Fetch GA data for the selected date range
    let analyticsData: AnalyticsData[] = [];
    let dataSource: 'google_analytics' | 'database_fallback' = 'database_fallback';
    try {
      urlParams.set('novelIds', novelSlugs.join(','));
      if (dateRange.start) {
        urlParams.set('startDate', dateRange.start);
      } else if (earliestCreated) {
        urlParams.set('startDate', earliestCreated.slice(0, 10)); // YYYY-MM-DD
      }
      if (dateRange.end) urlParams.set('endDate', dateRange.end);

      const analyticsUrl = `/api/analytics/novels?${urlParams.toString()}`;
      const analyticsResponse = await fetch(analyticsUrl);
      if (analyticsResponse.ok) {
        const analyticsResult = await analyticsResponse.json();
        if (analyticsResult.success) {
          analyticsData = analyticsResult.data;
          dataSource = analyticsResult.source;
          setAnalyticsError(null);
        } else {
          setAnalyticsError(analyticsResult.note || 'Failed to fetch analytics');
        }
      } else {
        setAnalyticsError('Analytics service unavailable');
      }
    } catch (err) {
      console.warn('Failed to fetch Google Analytics data:', err);
      setAnalyticsError('Failed to connect to analytics service');
    }

    // -------------------------------------------
    // Fetch aggregate totals (today & this month)
    // -------------------------------------------
    try {
      const todayISO = toISODate(new Date());
      const monthStart = toISODate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

      const totalsUrls = [
        `/api/analytics/novels?novelIds=${novelSlugs.join(',')}&startDate=${todayISO}&endDate=${todayISO}`, // today
        `/api/analytics/novels?novelIds=${novelSlugs.join(',')}&startDate=${monthStart}&endDate=${todayISO}` // this month
      ];
      if (earliestCreated) {
        const allTimeStart = earliestCreated.slice(0, 10);
        totalsUrls.push(`/api/analytics/novels?novelIds=${novelSlugs.join(',')}&startDate=${allTimeStart}&endDate=${todayISO}`); // all-time
      }

      const responses = await Promise.all(
        totalsUrls.map(url => fetch(url).then(r => (r.ok ? r.json() : null)).catch(() => null))
      );

      const [todayRes, monthRes, allRes] = [responses[0], responses[1], responses[2] ?? null];

      const sumViews = (payload: { success?: boolean; data?: AnalyticsData[] } | null): number =>
        payload?.success ? (payload.data ?? []).reduce((sum, e) => sum + (e.pageViews || 0), 0) : 0;

      setViewTotals({
        today: sumViews(todayRes),
        month: sumViews(monthRes),
        all: sumViews(allRes)
      });
    } catch (totalsErr) {
      console.warn('Failed to fetch aggregated totals:', totalsErr);
    }

    // Merge and format stats
    const formatted: NovelStats[] = novelData.map(novel => {
      const entry = analyticsData.find(e => e.novelId === novel.slug);
      const viewCount = entry?.pageViews ?? 0;
      return {
        id: novel.id,
        title: novel.title,
        total_views: viewCount,
        ga_views: entry?.pageViews,
        data_source: dataSource,
      };
    });

    setStats(formatted);

    // ----------------------------------------------------
    // Fetch local view counts from novel_view_logs
    // ----------------------------------------------------
    try {
      const todayISO = toISODate(new Date());
      const monthStartISO = toISODate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

      // Helper to count logs for given date range (end is exclusive)
      const addOneDay = (iso: string) => {
        const d = new Date(iso);
        d.setDate(d.getDate() + 1);
        return toISODate(d);
      };

      const countLogs = async (start?: string, endInclusive?: string) => {
        let q = supabase
          .from('novel_view_logs')
          .select('*', { count: 'exact', head: true })
          .in('novel_id', novelData.map(n => n.id));

        if (start) q = q.gte('viewed_at', start);
        if (endInclusive) q = q.lt('viewed_at', addOneDay(endInclusive));

        const { count } = await q;
        return count || 0;
      };

      const [todayCount, monthCount, allCount] = await Promise.all([
        countLogs(todayISO, todayISO),
        countLogs(monthStartISO, todayISO),
        countLogs(),
      ]);

      setLocalTotals({ today: todayCount, month: monthCount, all: allCount });

      // Per-novel counts (same date range as GA table)
      const perNovelPromises = novelData.map(async (novel) => {
        let q = supabase
          .from('novel_view_logs')
          .select('*', { count: 'exact', head: true })
          .eq('novel_id', novel.id);

        if (dateRange.start) q = q.gte('viewed_at', dateRange.start);
        if (dateRange.end) q = q.lt('viewed_at', addOneDay(dateRange.end));

        const { count } = await q;
        return { id: novel.id, title: novel.title, views: count || 0 } as LocalStat;
      });

      const localList = await Promise.all(perNovelPromises);
      setLocalStats(localList);
    } catch (logErr) {
      console.warn('Failed to fetch local log stats:', logErr);
    }

    setIsLoading(false);
  }, [dateRange]);

  // Initial + dependency-triggered fetch
  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (isLoading) {
    return (
      <section aria-busy="true" className="flex justify-center p-4">
        <Icon icon="mdi:loading" className="animate-spin text-4xl text-primary/60" />
      </section>
    );
  }

  // Prepare chart slices
  const chartColors: readonly string[] = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6',
    '#a855f7', '#ec4899', '#14b8a6', '#f59e0b', '#6366f1'
  ] as const;

  type ChartSlice = {
    title: string;
    value: number;
    color: (typeof chartColors)[number];
  };

  const chartData: ChartSlice[] = stats
    .filter(s => s.total_views > 0)
    .map((s, idx) => ({
      title: s.title,
      value: s.total_views,
      color: chartColors[idx % chartColors.length],
    }));

  return (
    <section className="p-4">
      {/* Aggregate totals */}
      <div className="grid grid-cols-3 gap-4 mb-6 max-w-xl">
        <div className="p-4 rounded-lg bg-muted/50 flex flex-col items-start">
          <span className="text-sm text-muted-foreground">Today&apos;s Views</span>
          <span className="text-2xl font-semibold tabular-nums">
            {viewTotals.today.toLocaleString()}
          </span>
        </div>
        <div className="p-4 rounded-lg bg-muted/50 flex flex-col items-start">
          <span className="text-sm text-muted-foreground">This Month</span>
          <span className="text-2xl font-semibold tabular-nums">
            {viewTotals.month.toLocaleString()}
          </span>
        </div>
        <div className="p-4 rounded-lg bg-muted/50 flex flex-col items-start">
          <span className="text-sm text-muted-foreground">All Time</span>
          <span className="text-2xl font-semibold tabular-nums">
            {viewTotals.all.toLocaleString()}
          </span>
        </div>
      </div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          Google Analytics views
          <span className="relative group cursor-default">
            <Icon icon="mdi:information-outline" className="text-base text-muted-foreground" />
            <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-background border border-border text-xs text-foreground rounded-lg p-2 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200 z-50">
              Counts views processed by Google Analytics. Numbers may be lower due to bot filtering and users with tracking disabled.
            </span>
          </span>
        </h2>
        <div className="text-right">
          <p className="text-sm text-muted-foreground italic">Views from Google Analytics</p>
          {stats[0]?.data_source === 'google_analytics' && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <Icon icon="mdi:google-analytics" className="text-sm" /> Analytics Active
            </p>
          )}
          {analyticsError && (
            <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
              <Icon icon="mdi:alert-circle-outline" className="text-sm" /> {analyticsError}
            </p>
          )}
        </div>
      </div>
      {/* Date controls */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <label className="text-sm">From</label>
        <input
          type="date"
          value={startInput}
          onChange={e => setStartInput(e.target.value)}
          max={endInput || toISODate(new Date())}
          className="border rounded-lg p-1 text-sm"
        />
        <label className="text-sm">to</label>
        <input
          type="date"
          value={endInput}
          onChange={e => setEndInput(e.target.value)}
          min={startInput || undefined}
          max={toISODate(new Date())}
          className="border rounded-lg p-1 text-sm"
        />

        {(startInput || endInput) && (
          <>
            <button
              type="button"
              onClick={() => setDateRange({ start: startInput || null, end: endInput || null })}
              className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90"
            >Apply</button>
            <button
              type="button"
              onClick={() => {
                setStartInput('');
                setEndInput('');
                setDateRange({ start: null, end: null });
              }}
              className="text-xs underline hover:text-foreground"
            >Clear</button>
          </>
        )}
      </div>
      {/* Pie chart & legend */}
      {chartData.length > 0 && (
        <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
          <div className="relative" style={{ width: 220, height: 220 }}>
            <PieChart
              data={chartData}
              lineWidth={60}
              style={{ width: 220, height: 220 }}
              animate
              onMouseOver={(_e, idx) => setHoverIndex(idx)}
              onMouseOut={() => setHoverIndex(null)}
            />
            {hoverIndex !== null && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-lg font-semibold bg-background/80 px-2 py-1 rounded-lg shadow">
                  {chartData[hoverIndex].value.toLocaleString()}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium mb-2">Views Distribution</h3>
            <ul className="space-y-1 max-h-[240px] overflow-auto pr-2">
              {chartData.map(d => (
                <li key={d.title} className="flex items-center gap-2 text-sm">
                  <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: d.color }} />
                  <span className="flex-1 line-clamp-1" title={d.title}>{d.title}</span>
                  <span className="font-medium tabular-nums">{d.value.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Local view log section */}
      {localStats.length > 0 && (
        <div className="mt-10">
          <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
            In House views
            <span className="relative group cursor-default">
              <Icon icon="mdi:information-outline" className="text-base text-muted-foreground" />
              <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-background border border-border text-xs text-foreground rounded-lg p-2 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200 z-50">
                Raw page requests recorded in our database. Includes all visitors (except bots).
              </span>
            </span>
          </h2>
          <div className="grid grid-cols-3 gap-4 mb-6 max-w-xl">
            <div className="p-4 rounded-lg bg-muted/50 flex flex-col items-start">
              <span className="text-sm text-muted-foreground">Today&apos;s Views</span>
              <span className="text-2xl font-semibold tabular-nums">
                {localTotals.today.toLocaleString()}
              </span>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 flex flex-col items-start">
              <span className="text-sm text-muted-foreground">This Month</span>
              <span className="text-2xl font-semibold tabular-nums">
                {localTotals.month.toLocaleString()}
              </span>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 flex flex-col items-start">
              <span className="text-sm text-muted-foreground">All Time</span>
              <span className="text-2xl font-semibold tabular-nums">
                {localTotals.all.toLocaleString()}
              </span>
            </div>
          </div>
          {/* Pie chart & legend for local logs */}
          {localStats.some(s => s.views > 0) && (
            <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
              <div className="relative" style={{ width: 220, height: 220 }}>
                <PieChart
                  data={localStats
                    .filter(s => s.views > 0)
                    .map((s, idx) => ({
                      title: s.title,
                      value: s.views,
                      color: chartColors[idx % chartColors.length],
                    }))}
                  lineWidth={60}
                  style={{ width: 220, height: 220 }}
                  animate
                  onMouseOver={(_e, idx) => setLocalHoverIndex(idx)}
                  onMouseOut={() => setLocalHoverIndex(null)}
                />
                {localHoverIndex !== null && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-lg font-semibold bg-background/80 px-2 py-1 rounded-lg shadow">
                      {localStats.filter(s => s.views > 0)[localHoverIndex].views.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
              <ul className="space-y-1 max-h-[240px] overflow-auto pr-2 text-sm flex-1">
                {localStats
                  .filter(s => s.views > 0)
                  .sort((a, b) => b.views - a.views)
                  .map((s, idx) => (
                    <li key={s.id} className="flex items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: chartColors[idx % chartColors.length] }} />
                      <span className="flex-1 line-clamp-1" title={s.title}>{s.title}</span>
                      <span className="font-medium tabular-nums">{s.views.toLocaleString()}</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
