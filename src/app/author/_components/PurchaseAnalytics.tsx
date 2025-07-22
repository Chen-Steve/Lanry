"use client";

import { useEffect, useState, useRef } from 'react';
import supabase from '@/lib/supabaseClient';
import { PieChart } from 'react-minimal-pie-chart';
import { Icon } from '@iconify/react';
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from 'chart.js';

// Register Chart.js components (safe to call multiple times)
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

// Shared color palette for charts
const CHART_COLORS: readonly string[] = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6',
  '#a855f7', '#ec4899', '#14b8a6', '#f59e0b', '#6366f1',
] as const;

// Generate distinct HSL colors beyond the preset palette
const getColor = (idx: number): string => {
  if (idx < CHART_COLORS.length) return CHART_COLORS[idx];
  // Use golden-angle to distribute hues
  const hue = (idx * 137.508) % 360; // golden angle in degrees
  return `hsl(${hue}, 65%, 55%)`;
};

// Utility to format Date -> YYYY-MM (e.g., 2025-07)
const toYearMonth = (iso: string) => iso.slice(0, 7);

interface RevenueByNovel {
  id: string;
  title: string;
  revenue: number;
}

interface RevenueByMonth {
  month: string; // YYYY-MM
  revenue: number;
}

export default function PurchaseAnalytics() {
  const [novelData, setNovelData] = useState<RevenueByNovel[]>([]);
  const [monthlyData, setMonthlyData] = useState<RevenueByMonth[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  // Store per-novel month revenue matrix between renders
  interface PerNovelMatrix {
    perNovelMonth: Record<string, Record<string, number>>;
    monthArray: RevenueByMonth[];
    novelArray: RevenueByNovel[];
  }
  const perNovelMonthRef = useRef<PerNovelMatrix | null>(null);

  // Destroy chart on unmount
  useEffect(() => {
    return () => {
      chartRef.current?.destroy();
    };
  }, []);

  // Fetch & process revenue data
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Fetch novels the author/translator owns
        const { data: novels } = await supabase
          .from('novels')
          .select('id, title')
          .or(`author_profile_id.eq.${user.id},translator_id.eq.${user.id}`);

        if (!novels || novels.length === 0) {
          setNovelData([]);
          setMonthlyData([]);
          return;
        }

        const novelIds = novels.map(n => n.id);
        const novelIdToTitle = Object.fromEntries(novels.map(n => [n.id, n.title] as const));

        // Fetch ALL paid unlocks for these novels (cost > 0)
        // We fetch in batches of 1000 to avoid large payload limits
        const batchSize = 1000;
        let from = 0;
        const aggregatedNovel: Record<string, number> = {}; // novelId -> revenue
        const aggregatedMonth: Record<string, number> = {}; // YYYY-MM -> revenue
        const perNovelMonth: Record<string, Record<string, number>> = {}; // novelId -> {month -> revenue}

        while (true) {
          const { data, error: batchErr, count } = await supabase
            .from('chapter_unlocks')
            .select('cost, created_at, novel_id', { count: 'exact' })
            .in('novel_id', novelIds)
            .gt('cost', 0)
            .range(from, from + batchSize - 1);

          if (batchErr) throw batchErr;
          if (!data) break;

          for (const row of data) {
            const revenue = row.cost * 0.7; // Author/translator share
            // Per-novel aggregation
            aggregatedNovel[row.novel_id] = (aggregatedNovel[row.novel_id] || 0) + revenue;
            // Per-month aggregation
            const ym = toYearMonth(row.created_at);
            aggregatedMonth[ym] = (aggregatedMonth[ym] || 0) + revenue;
            // Matrix aggregation
            if (!perNovelMonth[row.novel_id]) perNovelMonth[row.novel_id] = {};
            perNovelMonth[row.novel_id][ym] = (perNovelMonth[row.novel_id][ym] || 0) + revenue;
          }

          from += batchSize;
          if (!count || from >= count) break;
        }

        // Convert to sorted arrays
        const novelArray: RevenueByNovel[] = Object.entries(aggregatedNovel)
          .map(([novelId, revenue]) => ({ id: novelId, title: novelIdToTitle[novelId] ?? 'Unknown', revenue }))
          .sort((a, b) => b.revenue - a.revenue);

        const monthArray: RevenueByMonth[] = Object.entries(aggregatedMonth)
          .map(([month, revenue]) => ({ month, revenue }))
          .sort((a, b) => a.month.localeCompare(b.month));

        setNovelData(novelArray);
        setMonthlyData(monthArray);

        // Save matrix into ref for chart effect (simple solution: attach to window property)
        perNovelMonthRef.current = { perNovelMonth, monthArray, novelArray };
      } catch (err) {
        console.error('Error fetching revenue analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Draw / update monthly bar chart when data ready
  useEffect(() => {
    if (!canvasRef.current) return;
    if (!monthlyData.length) return;

    // Destroy previous instance if exists
    if (chartRef.current) chartRef.current.destroy();

    // Convert YYYY-MM -> "MonthName - Year" (e.g., "July - 2025")
    const labels = monthlyData.map(d => {
      const [year, month] = d.month.split('-');
      const date = new Date(Number(year), Number(month) - 1);
      const monthName = date.toLocaleString('default', { month: 'short' });
      return `${monthName} - ${year}`;
    });

    // Build stacked datasets (one per novel)
    const matrix = perNovelMonthRef.current;
    if (!matrix) return;

    const datasets = matrix.novelArray.map((novel, idx) => {
      const monthMap = matrix.perNovelMonth[novel.id] || {};
      const dataArr = matrix.monthArray.map(m => +((monthMap[m.month] || 0).toFixed(2)));
      return {
        label: novel.title,
        data: dataArr,
        backgroundColor: getColor(idx),
        stack: 'total',
      };
    });

    const data: ChartData<'bar'> = { labels, datasets };

    const options: ChartOptions<'bar'> = {
      responsive: true,
      plugins: {
        legend: { display: true, position: 'bottom' },
        tooltip: {
          callbacks: {
            label: ctx => `$${ctx.parsed.y.toFixed(2)}`,
          },
        },
      },
      scales: {
        x: { stacked: true },
        y: {
          stacked: true,
          beginAtZero: true,
          ticks: {
            callback: value => `$${value}`,
          },
        },
      },
    };

    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data,
      options,
    });
  }, [monthlyData]);

  if (isLoading) {
    return (
      <section className="flex justify-center p-4" aria-busy="true">
        <Icon icon="mdi:loading" className="animate-spin text-2xl text-primary/60" />
      </section>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg mb-6">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
          <Icon icon="mdi:alert-circle" className="text-lg" />
          <p className="font-medium">Error loading analytics</p>
        </div>
        <p className="text-sm text-red-500 dark:text-red-300">{error}</p>
      </div>
    );
  }

  if (novelData.length === 0) {
    return null; // Nothing to show
  }

  // Prepare pie chart slices (reuse colors from NovelStatistics)
  const pieData = novelData.map((d, idx) => ({
    title: d.title,
    value: +(d.revenue.toFixed(2)),
    color: getColor(idx),
  }));

  // Sum totals for display
  const totalRevenue = novelData.reduce((sum, n) => sum + n.revenue, 0);

  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        Earnings Overview
        <span className="text-sm font-normal text-muted-foreground">(after 30% platform fee)</span>
      </h2>

      {/* Pie chart / legend */}
      <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
        <div className="relative" style={{ width: 220, height: 220 }}>
          <PieChart
            data={pieData}
            lineWidth={60}
            style={{ width: 220, height: 220 }}
            animate
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-lg font-semibold bg-background/80 px-2 py-1 rounded-lg shadow">
              ${totalRevenue.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex-1 max-w-md w-full">
          <h3 className="text-lg font-medium mb-2">Revenue by Novel</h3>
          <ul className="space-y-1 max-h-[240px] overflow-auto pr-2 text-sm">
            {pieData.map(d => (
              <li key={d.title} className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: d.color }} />
                <span className="flex-1 line-clamp-1" title={d.title}>{d.title}</span>
                <span className="font-medium tabular-nums">${d.value.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Monthly bar chart */}
      {monthlyData.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Monthly Revenue</h3>
          <div className="w-full overflow-x-auto">
            <canvas ref={canvasRef} height={100} />
          </div>
        </div>
      )}
    </section>
  );
} 