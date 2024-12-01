import { useQuery } from '@tanstack/react-query';
import supabase from '@/lib/supabaseClient';
import type { ReadingHistory } from '@/types/database';
import Link from 'next/link';
import { formatRelativeDate } from '@/lib/utils';
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
  const { data: history, isLoading, error } = useQuery<ReadingHistory[]>({
    queryKey: ['readingHistory', userId],
    queryFn: () => fetchReadingHistory(userId),
    staleTime: 1000 * 60 * 5,
    enabled: !!userId,
  });

  if (isLoading) {
    return <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />;
  }

  if (error) {
    return (
      <>
        <Icon icon="mdi:alert" className="w-12 h-12 mx-auto mb-2" />
        <p className="text-center text-red-500">Error loading reading history</p>
      </>
    );
  }

  if (!history || history.length === 0) {
    return (
      <>
        <Icon icon="mdi:book-open-page-variant" className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <p className="text-center text-gray-500 text-lg">
          No reading history yet. Start reading some novels!
        </p>
      </>
    );
  }

  return (
    <>
      {history.map((item) => (
        <article
          key={item.id}
          className="-mx-4 sm:mx-0 flex gap-4 items-start min-w-0 px-4 sm:px-0"
        >
          <Link 
            href={`/novels/${item.novel.slug}`} 
            className="hover:opacity-80 transition-opacity flex-shrink-0"
          >
            <Image
              src={`/novel-covers/${item.novel.coverImageUrl}` || '/images/default-cover.jpg'}
              alt={item.novel.title}
              width={120}
              height={168}
              className="object-cover shadow-sm w-[80px] h-[80px] sm:w-[120px] sm:h-[168px]"
            />
          </Link>
          <div className="flex-grow min-w-0">
            <Link 
              href={`/novels/${item.novel.slug}`}
              className="text-black font-medium text-lg hover:text-blue-600 transition-colors block truncate"
            >
              {item.novel.title}
            </Link>
            <p className="text-sm text-black mt-1 truncate">by {item.novel.author}</p>
            <p className="text-sm text-gray-600 mt-2 truncate">
              Last read: {formatRelativeDate(item.last_read)}
            </p>
          </div>
          <Link
            href={`/novels/${item.novel.slug}/chapters/c${item.last_chapter}`}
            className="flex flex-col items-center gap-0.5 bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 sm:py-2 sm:px-4 rounded-md transition-colors active:bg-blue-700 touch-action-manipulation whitespace-nowrap flex-shrink-0 text-sm sm:text-base"
          >
            <span>Continue</span>
            <span>Ch.{item.last_chapter}</span>
          </Link>
        </article>
      ))}
    </>
  );
};

export default ReadingHistorySection; 