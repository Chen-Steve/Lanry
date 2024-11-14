import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';
import { Icon } from '@iconify/react';
import { formatDate } from '@/lib/utils';

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
            profile:profiles!inner (
              username
            ),
            novel:novels!inner (
              title
            )
          `)
          .in('novel_id', novelIds)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform the data to match our interface
        const transformedData = (data || []).map(item => ({
          id: item.id,
          created_at: item.created_at,
          cost: item.cost,
          chapter_number: item.chapter_number,
          profile: {
            username: item.profile?.[0]?.username || 'Unknown User'
          },
          novel: {
            title: item.novel?.[0]?.title || 'Unknown Novel'
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
        <Icon icon="mdi:loading" className="animate-spin text-2xl text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-500">
        <Icon icon="mdi:alert" className="text-2xl mb-2" />
        <p>{error}</p>
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <Icon icon="mdi:book-open-page-variant" className="text-3xl mb-2" />
        <p>No chapter purchases yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium text-gray-900">Chapter Purchase History</h3>
        <p className="mt-1 text-sm text-gray-500">
          A list of all chapters purchased by readers
        </p>
      </div>
      <div className="border-t border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reader
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Novel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chapter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {purchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {purchase.profile.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {purchase.novel.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Chapter {purchase.chapter_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {purchase.cost} coins
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(purchase.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 