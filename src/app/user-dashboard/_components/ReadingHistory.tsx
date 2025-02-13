import { useQuery } from '@tanstack/react-query';
import supabase from '@/lib/supabaseClient';
import type { ReadingHistory } from '@/types/database';
import Link from 'next/link';
import { formatRelativeDate } from '@/lib/utils';
import { Icon } from '@iconify/react';
import Image from 'next/image';
import { memo, useState } from 'react';
import { Button } from '@/components/ui/button';

const ITEMS_PER_PAGE = 6;

const fetchReadingHistory = async (userId: string | undefined, page: number = 1) => {
  if (!userId) throw new Error('Not authenticated');

  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  const [{ data, error }, { count }] = await Promise.all([
    supabase
      .from('reading_history')
      .select(`
        *,
        novel:novels (
          id,
          title,
          slug,
          cover_image_url
        )
      `)
      .eq('profile_id', userId)
      .order('last_read', { ascending: false })
      .range(from, to),
    supabase
      .from('reading_history')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', userId)
  ]);

  if (error) throw error;
  
  // Map the data to match our Novel type
  return {
    items: (data || []).map(item => ({
      ...item,
      lastChapter: item.last_chapter,
      lastPartNumber: item.last_part_number,
      lastRead: item.last_read,
      novel: {
        ...item.novel,
        coverImageUrl: item.novel.cover_image_url
      }
    })),
    totalPages: Math.ceil((count || 0) / ITEMS_PER_PAGE),
    currentPage: page
  };
};

interface ReadingHistorySectionProps {
  userId: string | undefined;
}

const LoadingState = () => (
  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
    {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="aspect-[2/3] bg-muted rounded-sm" />
        <div className="mt-1 h-2 bg-muted rounded w-3/4" />
        <div className="mt-1 h-2 bg-muted rounded w-1/2" />
      </div>
    ))}
  </div>
);

const HistoryItem = memo(({ item, index }: { item: ReadingHistory; index: number }) => {
  // Always prioritize first visible items since this is the default tab
  const isPriority = index < 12; // First 12 items (first row across all breakpoints)

  const chapterPath = item.lastPartNumber 
    ? `c${item.lastChapter}-p${item.lastPartNumber}`
    : `c${item.lastChapter}`;

  return (
    <div className="relative group space-y-0.5">
      <Link 
        href={`/novels/${item.novel.slug}/${chapterPath}`}
        className="block space-y-0.5"
      >
        <div className="aspect-[2/3] relative overflow-hidden rounded-sm shadow-sm hover:shadow transition-shadow">
          <Image
            src={item.novel.coverImageUrl?.startsWith('http') 
              ? item.novel.coverImageUrl 
              : item.novel.coverImageUrl 
                ? `/novel-covers/${item.novel.coverImageUrl}` 
                : '/images/default-cover.jpg'}
            alt={item.novel.title}
            fill
            sizes="(max-width: 640px) 25vw, (max-width: 768px) 16.67vw, (max-width: 1024px) 12.5vw, 8.33vw"
            loading={isPriority ? "eager" : "lazy"}
            priority={isPriority}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute top-0.5 right-0.5 text-[10px] px-1.5 py-0.5 bg-black/60 text-white rounded-sm">
            Ch.{item.lastChapter}{item.lastPartNumber ? `.${item.lastPartNumber}` : ''}
          </div>
        </div>
        <div className="px-0.5">
          <h3 className="text-[10px] font-medium truncate leading-tight hover:text-primary transition-colors">
            {item.novel.title}
          </h3>
          <span className="text-[10px] text-muted-foreground">
            {formatRelativeDate(item.lastRead)}
          </span>
        </div>
      </Link>
    </div>
  );
});
HistoryItem.displayName = 'HistoryItem';

const PaginationControls = ({ currentPage, totalPages, onPageChange }: { 
  currentPage: number; 
  totalPages: number; 
  onPageChange: (page: number) => void;
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      {currentPage > 1 && (
        <Button
          variant="outline"
          onClick={() => onPageChange(currentPage - 1)}
          className="h-8 px-2 border-border hover:bg-accent hover:text-accent-foreground dark:border-border dark:hover:bg-gray-800"
        >
          <Icon icon="mdi:chevron-left" className="w-4 h-4" />
        </Button>
      )}
      <span className="text-sm text-foreground">
        Page {currentPage} of {totalPages}
      </span>
      {currentPage < totalPages && (
        <Button
          variant="outline"
          onClick={() => onPageChange(currentPage + 1)}
          className="h-8 px-2 border-border hover:bg-accent hover:text-accent-foreground dark:border-border dark:hover:bg-gray-800"
        >
          <Icon icon="mdi:chevron-right" className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

const ReadingHistorySection = ({ userId }: ReadingHistorySectionProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  const { data: historyData, isLoading, error } = useQuery({
    queryKey: ['readingHistory', userId, currentPage],
    queryFn: () => fetchReadingHistory(userId, currentPage),
    staleTime: 1000 * 60 * 5,
    enabled: !!userId,
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <Icon icon="mdi:alert" className="w-12 h-12 mx-auto mb-2 text-red-500 dark:text-red-400" />
        <p className="text-red-500 dark:text-red-400">Error loading reading history</p>
      </div>
    );
  }

  if (!historyData?.items || historyData.items.length === 0) {
    return (
      <div className="text-center py-12">
        <Icon icon="mdi:book-open-page-variant" className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <p className="text-center text-muted-foreground text-lg">
          No reading history yet. Start reading some novels!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
        {historyData.items.map((item, index) => (
          <HistoryItem key={item.id} item={item} index={index} />
        ))}
      </div>
      <PaginationControls
        currentPage={historyData.currentPage}
        totalPages={historyData.totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default ReadingHistorySection;