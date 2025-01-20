import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';
import { Icon } from '@iconify/react';
import { formatDate } from '@/lib/utils';

interface RawPurchaseRecord {
  id: string;
  created_at: string;
  cost: number;
  chapter_number: number;
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

  useEffect(() => {
    async function fetchPurchaseHistory() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
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

        const { data, error } = await supabase
          .from('chapter_unlocks')
          .select(`
            id,
            created_at,
            cost,
            chapter_number,
            profile_id,
            novel_id,
            profiles:profile_id(username),
            novels:novel_id(title)
          `)
          .in('novel_id', novelIds)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const transformedData = ((data as unknown) as RawPurchaseRecord[]).map(item => ({
          id: item.id,
          created_at: item.created_at,
          cost: item.cost,
          chapter_number: item.chapter_number,
          profile: {
            username: item.profiles?.username || 'Unknown User'
          },
          novel: {
            title: item.novels?.title || 'Unknown Novel'
          }
        }));

        setPurchases(transformedData);
      } catch (err) {
        console.error('Error fetching purchase history:', err);
        setError(err instanceof Error ? err.message : 'Failed to load purchase history');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPurchaseHistory();
  }, []);

  if (isLoading) {
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

  if (purchases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Icon icon="mdi:book-open-page-variant" className="text-4xl text-muted-foreground mb-2" />
        <p className="text-muted-foreground">No chapter purchases yet</p>
        <p className="text-xs text-muted-foreground mt-1">Purchases will appear here when readers buy your chapters</p>
      </div>
    );
  }

  return (
    <div className="min-w-0 w-full">
      <div className="bg-background rounded-lg border border-border">
        <div className="p-3 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-medium truncate">Purchase History</h3>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">Recent chapter purchases</p>
            </div>
            <div className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded shrink-0">
              {purchases.length} {purchases.length === 1 ? 'Purchase' : 'Purchases'}
            </div>
          </div>
        </div>
        
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
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-1 text-primary font-medium">
                    <Icon icon="solar:dollar-minimalistic-bold" className="text-base shrink-0" />
                    <span className="text-sm">{Math.floor(purchase.cost * 0.8)}</span>
                  </div>
                  <time className="text-xs text-muted-foreground">
                    {formatDate(purchase.created_at)}
                  </time>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 