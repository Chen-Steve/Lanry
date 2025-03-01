'use client';

import { Novel } from '@/types/database';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getTotalAllChapters } from '@/services/chapterService';
import NovelCover from './NovelCover';

interface NovelCardProps {
  novel: Novel;
  isPriority?: boolean;
  size?: 'thumbnail' | 'small' | 'medium' | 'large';
  className?: string;
}

const NovelCard = ({ novel, isPriority = false, size = 'small', className = '' }: NovelCardProps) => {
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
      className={`block hover:bg-accent rounded-lg transition-colors ${className}`}
      onClick={handleClick}
    >
      <div className="flex flex-col">
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
          chapterCount={totalChapters}
        />
        <div className="mt-0.5">
          <h3 className="text-base sm:text-base text-foreground leading-none line-clamp-2">
            {novel.title}
          </h3>
        </div>
      </div>
    </Link>
  );
};

export default NovelCard; 