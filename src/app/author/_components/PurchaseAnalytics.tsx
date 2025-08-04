"use client";

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';
import { Icon } from '@iconify/react';

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
  const [coinBalance, setCoinBalance] = useState<number>(0);
  const [perNovelMonth, setPerNovelMonth] = useState<Record<string, Record<string, number>>>({});
  const [showMonthly, setShowMonthly] = useState(false);
  // Removed monthlyData and matrix persistence
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Removed Chart.js refs as we no longer render the bar chart
  // Removed PerNovelMatrix as bar chart was removed

  // No Chart.js instance to destroy anymore

  // Fetch & process revenue data
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Fetch profile to get current coin balance
        const { data: profile } = await supabase
          .from('profiles')
          .select('coins')
          .eq('id', user.id)
          .maybeSingle();

        setCoinBalance(profile?.coins ?? 0);

        // Fetch novels the author/translator owns
        const { data: novels } = await supabase
          .from('novels')
          .select('id, title')
          .or(`author_profile_id.eq.${user.id},translator_id.eq.${user.id}`);

        if (!novels || novels.length === 0) {
          setNovelData([]);
          // Removed monthlyData and matrix persistence
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
        const perNovel: Record<string, Record<string, number>> = {}; // novelId -> {month: revenue}

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
            // Per novel-month aggregation
            if (!perNovel[row.novel_id]) perNovel[row.novel_id] = {};
            perNovel[row.novel_id][ym] = (perNovel[row.novel_id][ym] || 0) + revenue;
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
        setPerNovelMonth(perNovel);
      } catch (err) {
        console.error('Error fetching revenue analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Removed bar chart effect – now we only show the pie chart

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

  const totalRevenue = novelData.reduce((sum, n) => sum + n.revenue, 0);

  // Helper to convert YYYY-MM to "Mon YYYY"
  const prettyMonth = (ym: string) => {
    const [year, month] = ym.split('-');
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleString('default', { month: 'short', year: 'numeric' });
  };

  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold mb-6">Earnings Overview</h2>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="p-4 rounded-lg bg-muted flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Current Balance</span>
          <span className="text-2xl font-semibold tabular-nums">{coinBalance.toFixed(1)} coins</span>
        </div>
        <div className="p-4 rounded-lg bg-muted flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Lifetime Earnings</span>
          <span className="text-2xl font-semibold tabular-nums">{totalRevenue.toFixed(1)} coins</span>
        </div>
      </div>

      {/* Monthly earnings table */}
      {monthlyData.length > 0 && (
        <div className="max-w-2xl w-full">
          <button
            onClick={() => setShowMonthly(p => !p)}
            className="flex items-center justify-between w-full px-3 py-2 bg-muted rounded-lg hover:bg-muted/70 transition-colors"
          >
            <span className="text-lg font-medium">Monthly Earnings</span>
            <Icon icon={showMonthly ? 'mdi:chevron-up' : 'mdi:chevron-down'} className="text-xl" />
          </button>

          {showMonthly && (
            <div className="border rounded-lg mt-3 overflow-hidden divide-y">
              {monthlyData.map(m => (
                <div key={m.month} className="p-3 bg-background/50">
                  <div className="font-medium mb-2 text-muted-foreground">{prettyMonth(m.month)}</div>
                  <ul className="space-y-0.5 text-sm ml-2">
                    {novelData.map(novel => {
                      const amount = perNovelMonth[novel.id]?.[m.month] ?? 0;
                      if (amount === 0) return null;
                      return (
                        <li key={novel.id} className="flex justify-between">
                          <span>{novel.title}</span>
                          <span className="tabular-nums">{amount.toFixed(1)} coins</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
} 