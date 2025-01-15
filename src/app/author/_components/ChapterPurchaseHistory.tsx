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

export default function ChapterPurchaseHistory() {
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPurchaseHistory() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // First get the author's novels
        const { data: novels } = await supabase
          .from('novels')
          .select('id')
          .eq('author_profile_id', user.id);

        if (!novels || novels.length === 0) {
          setPurchases([]);
          return;
        }

        const novelIds = novels.map(novel => novel.id);

        // Then get the purchase history for those novels
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

        // Transform the data to match our interface
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
    return (
      <div className="flex justify-center items-center p-4">
        <Icon icon="mdi:loading" className="animate-spin text-2xl text-primary/60" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-500 dark:text-red-400">
        <Icon icon="mdi:alert" className="text-2xl" />
        <p>{error}</p>
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <div className="text-center p-4 text-muted-foreground">
        <p>No chapter purchases yet</p>
      </div>
    );
  }

  return (
    <div className="px-2">
      <div className="bg-background rounded-lg border border-border">
        <div className="p-3 border-b border-border">
          <h3 className="font-medium">Purchase History</h3>
          <p className="text-xs text-muted-foreground">Chapters purchased by readers</p>
        </div>
        
        <div className="grid gap-1 p-2">
          {purchases.map((purchase) => (
            <div
              key={purchase.id}
              className="flex flex-col p-2 rounded border border-border hover:bg-muted/50"
            >
              <div className="flex justify-between text-sm">
                <span className="font-medium">{purchase.profile.username}</span>
                <span className="text-xs text-muted-foreground">{formatDate(purchase.created_at)}</span>
              </div>
              
              <div className="flex justify-between items-center mt-1 text-sm">
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <span className="truncate">{purchase.novel.title}</span>
                  <span className="text-xs text-muted-foreground ml-1">Ch.{purchase.chapter_number}</span>
                </div>
                <span className="text-primary font-medium ml-2 shrink-0">{Math.floor(purchase.cost * 0.9)} coins</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 