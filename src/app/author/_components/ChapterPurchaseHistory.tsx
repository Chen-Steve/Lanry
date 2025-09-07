'use client';

import { useEffect, useState, useCallback } from 'react';
import supabase from '@/lib/supabaseClient';
import { useSupabase } from '@/app/providers';
import { Icon } from '@iconify/react';
import { formatDate } from '@/lib/utils';
import PurchaseAnalytics from './PurchaseAnalytics';

interface RawPurchaseRecord {
  id: string;
  created_at: string;
  cost: number;
  chapter_number: number;
  part_number?: number | null;
  profiles: {
    username: string;
  };
  novels: {
    title: string;
  };
}

interface PurchaseRecord {
  id: string;
  created_at: string;
  cost: number;
  chapter_number: number;
  part_number?: number | null;
  profile: {
    username: string;
  };
  novel: {
    title: string;
  };
}

// Loading skeleton component
const PurchaseSkeleton = () => (
  <div className="animate-pulse space-y-3 p-3">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex flex-col gap-2 p-3 border border-border/50 rounded-lg">
        <div className="flex justify-between items-center">
          <div className="h-4 bg-muted rounded w-24" />
          <div className="h-3 bg-muted rounded w-16" />
        </div>
        <div className="flex justify-between items-center">
          <div className="h-4 bg-muted rounded w-32" />
          <div className="h-4 bg-muted rounded w-16" />
        </div>
      </div>
    ))}
  </div>
);

export default function ChapterPurchaseHistory() {
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const { user } = useSupabase();
  const pageSize = 50; // Changed back to 50 records to reduce egress
  const [totalCount, setTotalCount] = useState(0);
  const [pageInputValue, setPageInputValue] = useState('');
  const fetchPurchaseHistory = useCallback(async (pageNumber = 1) => {
    try {
      setIsLoading(true);
      if (!user) throw new Error('Not authenticated');

      const { data: novels } = await supabase
        .from('novels')
        .select('id')
        .eq('author_profile_id', user.id);

      if (!novels || novels.length === 0) {
        setPurchases([]);
        return;
      }

      const novelIds = novels.map(novel => novel.id);

      // Calculate pagination range
      const from = (pageNumber - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from('chapter_unlocks')
        .select(
          `id,
          created_at,
          cost,
          chapter_number,
          part_number,
          profile_id,
          novel_id,
          profiles:profile_id(username),
          novels:novel_id(title)`,
          { count: 'exact' }
        )
        .in('novel_id', novelIds)
        .gt('cost', 0) // Exclude zero-share unlocks
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const transformedData = ((data as unknown) as RawPurchaseRecord[]).map(item => ({
        id: item.id,
        created_at: item.created_at,
        cost: item.cost,
        chapter_number: item.chapter_number,
        part_number: item.part_number,
        profile: {
          username: item.profiles?.username || 'Unknown User'
        },
        novel: {
          title: item.novels?.title || 'Unknown Novel'
        }
      }));

      setPurchases(transformedData);
      
      if (count !== null) {
        setTotalCount(count);
      }
      
    } catch (err) {
      console.error('Error fetching purchase history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load purchase history');
    } finally {
      setIsLoading(false);
    }
  }, [user, pageSize]);

  useEffect(() => {
    fetchPurchaseHistory();
  }, [fetchPurchaseHistory]);

  const goToPage = (newPage: number) => {
    if (newPage >= 1 && (newPage - 1) * pageSize < totalCount) {
      setPage(newPage);
      fetchPurchaseHistory(newPage);
      setPageInputValue('');
    }
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const value = e.target.value.replace(/[^0-9]/g, '');
    setPageInputValue(value);
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNumber = parseInt(pageInputValue, 10);
    if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
      goToPage(pageNumber);
    } else {
      // Reset input if invalid
      setPageInputValue('');
    }
  };

  if (isLoading && page === 1) {
    return <PurchaseSkeleton />;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg mx-3">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
          <Icon icon="mdi:alert-circle" className="text-lg" />
          <p className="font-medium">Error loading purchase history</p>
        </div>
        <p className="text-sm text-red-500 dark:text-red-300">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 text-sm px-3 py-1.5 bg-background border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-md hover:bg-accent transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (purchases.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Icon icon="mdi:book-open-page-variant" className="text-4xl text-muted-foreground mb-2" />
        <p className="text-muted-foreground">No chapter purchases yet</p>
        <p className="text-xs text-muted-foreground mt-1">Purchases will appear here when readers buy your chapters</p>
      </div>
    );
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="min-w-0 w-full">
      {/* Earnings overview charts */}
      <PurchaseAnalytics />

      {/* Existing purchase history list wrapper */}
      <div className="bg-background rounded-lg border border-border">
        <div className="p-3 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-medium truncate">Purchase History</h3>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                Showing page {page} of {totalPages} ({totalCount} {totalCount === 1 ? 'purchase' : 'purchases'})
              </p>
            </div>
            <div className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded shrink-0">
              {pageSize} per page
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <PurchaseSkeleton />
        ) : (
          <div className="divide-y divide-border">
            {purchases.map((purchase) => (
              <div
                key={purchase.id}
                className="p-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm truncate">
                        {purchase.profile.username}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">purchased</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 min-w-0">
                      <span className="text-sm truncate text-muted-foreground flex-1 min-w-0">
                        {purchase.novel.title}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 bg-secondary/50 rounded shrink-0">
                        Ch.{purchase.chapter_number}
                        {purchase.part_number && `.${purchase.part_number}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex items-center gap-1 text-primary font-medium">
                      <Icon icon="ph:stop-circle" className="text-base shrink-0 text-amber-500" />
                      <span className="text-sm">{(purchase.cost * 0.7).toFixed(1)} coins</span>
                    </div>
                    <time className="text-xs text-muted-foreground">
                      {formatDate(purchase.created_at)}
                    </time>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {totalPages > 1 && (
          <div className="p-3 border-t border-border">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1 || isLoading}
                  className="py-1.5 px-3 bg-muted hover:bg-muted/80 rounded-md text-sm font-medium flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon icon="mdi:chevron-left" className="text-base" />
                  Previous
                </button>
                
                <div className="flex items-center gap-1 text-sm">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Show at most 5 page buttons
                    let pageNum;
                    if (totalPages <= 5) {
                      // If 5 or fewer pages, show all
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      // If near start, show first 5
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      // If near end, show last 5
                      pageNum = totalPages - 4 + i;
                    } else {
                      // Otherwise show current and 2 on each side
                      pageNum = page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        disabled={isLoading}
                        className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
                          page === pageNum 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button 
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages || isLoading}
                  className="py-1.5 px-3 bg-muted hover:bg-muted/80 rounded-md text-sm font-medium flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <Icon icon="mdi:chevron-right" className="text-base" />
                </button>
              </div>
              
              <form onSubmit={handlePageInputSubmit} className="flex items-center gap-2">
                <label htmlFor="page-input" className="text-sm text-muted-foreground">
                  Go to page:
                </label>
                <div className="relative flex items-center">
                  <input
                    id="page-input"
                    type="text"
                    value={pageInputValue}
                    onChange={handlePageInputChange}
                    placeholder={String(page)}
                    className="w-16 h-8 px-2 py-1 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    disabled={isLoading}
                  />
                  <span className="text-xs text-muted-foreground ml-1">
                    of {totalPages}
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={!pageInputValue || isLoading}
                  className="py-1 px-2 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Go
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 