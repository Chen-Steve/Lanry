'use client';

import { Novel } from '@/types/database';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getTotalAllChapters } from '@/services/chapterService';
import { Icon } from '@iconify/react';
import NovelCover from './NovelCover';

interface NovelStatsProps {
  totalChapters: number;
}

const NovelStats = ({ totalChapters }: NovelStatsProps) => (
  <div className="flex items-center gap-1 text-xs text-muted-foreground">
    <Icon icon="pepicons-print:book" className="text-sm" />
    <span>{totalChapters} Chapters</span>
  </div>
);

interface NovelCardProps {
  novel: Novel;
  isPriority?: boolean;
  size?: 'thumbnail' | 'small' | 'medium' | 'large';
}

const NovelCard = ({ novel, isPriority = false, size = 'small' }: NovelCardProps) => {
  const [totalChapters, setTotalChapters] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const total = await getTotalAllChapters(novel.id);
        setTotalChapters(total);
      } catch (err) {
        console.error('Failed to fetch chapter data:', err);
      }
    };

    fetchData();
  }, [novel.id]);

  const handleClick = async () => {
    try {
      await fetch(`/api/novels/${novel.id}/views`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to increment views:', error);
    }
  };

  // Find yaoi/yuri category if it exists and only if there are chapters
  const category = totalChapters > 0 ? novel.categories?.find(cat => 
    cat.name.toLowerCase() === 'yaoi' || cat.name.toLowerCase() === 'yuri'
  ) : undefined;

  return (
    <Link 
      href={`/novels/${novel.slug}`} 
      className="block p-0.5 sm:p-2 hover:bg-accent rounded-lg transition-colors h-full"
      onClick={handleClick}
    >
      <div className="flex flex-col h-full">
        <NovelCover 
          coverUrl={novel.coverImageUrl} 
          title={novel.title}
          isPriority={isPriority}
          rating={novel.rating}
          showRating={totalChapters > 0}
          status={novel.status}
          showStatus={totalChapters > 0}
          hasChapters={totalChapters > 0}
          category={category?.name.toLowerCase() as 'yaoi' | 'yuri'}
          size={size}
        />
        <div className="mt-1 sm:mt-2 flex-1 min-h-[3rem] flex flex-col justify-between">
          <h3 className="text-xs sm:text-sm text-foreground font-medium leading-tight max-h-[2.5rem] line-clamp-2 overflow-hidden">
            {novel.title}
          </h3>
          <NovelStats totalChapters={totalChapters} />
        </div>
      </div>
    </Link>
  );
};

export default NovelCard; 