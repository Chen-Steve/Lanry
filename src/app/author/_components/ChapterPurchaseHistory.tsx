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
      <div className="flex justify-center items-center p-8">
        <Icon icon="mdi:loading" className="animate-spin text-2xl text-primary/60" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-500 dark:text-red-400">
        <Icon icon="mdi:alert" className="text-2xl mb-2" />
        <p>{error}</p>
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <Icon icon="mdi:book-open-page-variant" className="text-3xl mb-2" />
        <p>No chapter purchases yet</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4">
      <div className="bg-background rounded-lg shadow overflow-hidden border border-border">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium text-foreground">Chapter Purchase History</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            A list of all chapters purchased by readers
          </p>
        </div>
        <div className="border-t border-border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Reader
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Novel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Chapter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Earnings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-border">
                {purchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {purchase.profile.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {purchase.novel.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      Chapter {purchase.chapter_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {Math.floor(purchase.cost * 0.9)} coins
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(purchase.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 