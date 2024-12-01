import { useQuery } from '@tanstack/react-query';
import supabase from '@/lib/supabaseClient';
import type { ReadingHistory } from '@/types/database';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { Icon } from '@iconify/react';
import Image from 'next/image';

// Update the fetch function to handle undefined userId
const fetchReadingHistory = async (userId: string | undefined) => {
  if (!userId) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('reading_history')
    .select(`
      *,
      novel:novels (
        id,
        title,
        slug,
        author,
        cover_image_url
      )
    `)
    .eq('profile_id', userId)
    .order('last_read', { ascending: false });

  if (error) throw error;
  
  // Map the data to match our Novel type
  return (data || []).map(item => ({
    ...item,
    novel: {
      ...item.novel,
      coverImageUrl: item.novel.cover_image_url
    }
  }));
};

interface ReadingHistorySectionProps {
  userId: string | undefined;
}

const ReadingHistorySection = ({ userId }: ReadingHistorySectionProps) => {
  // Update query to pass userId
  const { data: history, isLoading, error } = useQuery<ReadingHistory[]>({
    queryKey: ['readingHistory', userId],
    queryFn: () => fetchReadingHistory(userId),
    staleTime: 1000 * 60 * 5,
    enabled: !!userId, // Only run query when userId is available
  });

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        <Icon icon="mdi:alert" className="w-12 h-12 mx-auto mb-2" />
        <p>Error loading reading history</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Recently Read</h2>
      {!history || history.length === 0 ? (
        <div className="text-center py-8">
          <Icon icon="mdi:book-open-page-variant" className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">
            No reading history yet. Start reading some novels!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-4"
            >
              <div className="flex gap-4">
                <Link href={`/novels/${item.novel.slug}`} className="shrink-0">
                  <Image
                    src={`/novel-covers/${item.novel.coverImageUrl}` || '/images/default-cover.jpg'}
                    alt={item.novel.title}
                    width={80}
                    height={112}
                    className="object-cover rounded"
                  />
                </Link>
                <div>
                  <h3 className="font-medium hover:text-blue-600">
                    <Link href={`/novels/${item.novel.slug}`}>
                      {item.novel.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-gray-500">by {item.novel.author}</p>
                  <p className="text-sm text-gray-500">
                    Last read: Chapter {item.last_chapter} • {formatDate(item.last_read)}
                  </p>
                </div>
              </div>
              <Link
                href={`/novels/${item.novel.slug}/chapters/c${item.last_chapter}`}
                className="flex items-center gap-2 text-blue-500 hover:text-blue-600 transition-colors"
              >
                <Icon icon="mdi:book-open-page-variant" />
                <span>Continue Reading</span>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReadingHistorySection; 