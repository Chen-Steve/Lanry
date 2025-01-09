import { useQuery } from '@tanstack/react-query';
import supabase from '@/lib/supabaseClient';
import type { ReadingHistory } from '@/types/database';
import Link from 'next/link';
import { formatRelativeDate } from '@/lib/utils';
import { Icon } from '@iconify/react';
import Image from 'next/image';

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
    return <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />;
  }

  if (error) {
    return (
      <>
        <Icon icon="mdi:alert" className="w-12 h-12 mx-auto mb-2 text-red-500 dark:text-red-400" />
        <p className="text-center text-red-500 dark:text-red-400">Error loading reading history</p>
      </>
    );
  }

  if (!history || history.length === 0) {
    return (
      <>
        <Icon icon="mdi:book-open-page-variant" className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <p className="text-center text-muted-foreground text-lg">
          No reading history yet. Start reading some novels!
        </p>
      </>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2">
      {history.map((item) => (
        <article
          key={item.id}
          className="flex gap-2 items-center min-w-0 px-3 py-1 border-b border-border/40 first:border-t md:first:border-t-0 md:even:border-l hover:bg-accent/5 transition-colors"
        >
          <Link 
            href={`/novels/${item.novel.slug}`} 
            className="hover:opacity-80 transition-opacity flex-shrink-0"
          >
            <Image
              src={item.novel.coverImageUrl?.startsWith('http') ? item.novel.coverImageUrl : item.novel.coverImageUrl ? `/novel-covers/${item.novel.coverImageUrl}` : '/images/default-cover.jpg'}
              alt={item.novel.title}
              width={80}
              priority
              height={80}
              className="object-cover shadow-sm w-[40px] h-[40px] sm:w-[50px] sm:h-[50px]"
            />
          </Link>
          <div className="flex-grow min-w-0 space-y-0">
            <Link 
              href={`/novels/${item.novel.slug}`}
              className="text-foreground font-medium text-sm hover:text-primary transition-colors block truncate"
            >
              {item.novel.title}
            </Link>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-foreground truncate">by {item.novel.author}</span>
              <span className="text-muted-foreground truncate">· {formatRelativeDate(item.last_read)}</span>
            </div>
          </div>
          <Link
            href={`/novels/${item.novel.slug}/c${item.last_chapter}`}
            className="flex items-center gap-1 text-foreground px-2 py-0.5 border border-border/60 rounded touch-action-manipulation whitespace-nowrap flex-shrink-0 text-xs transition-colors hover:bg-accent"
          >
            <span>Ch.{item.last_chapter}</span>
          </Link>
        </article>
      ))}
    </div>
  );
};

export default ReadingHistorySection; 