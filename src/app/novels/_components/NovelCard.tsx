'use client';

import { Novel } from '@/types/database';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getTotalChapters } from '@/services/chapterService';
import NovelCover from './NovelCover';
import NovelStats from './NovelStats';

interface NovelCardProps {
  novel: Novel;
  isPriority?: boolean;
}

const NovelCard = ({ novel, isPriority = false }: NovelCardProps) => {
  const [totalChapters, setTotalChapters] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const total = await getTotalChapters(novel.id);
        setTotalChapters(total);
      } catch (err) {
        console.error('Failed to fetch chapter data:', err);
      }
    };

    fetchData();
  }, [novel.id]);

  return (
    <Link 
      href={`/novels/${novel.slug}`} 
      className="block p-0.5 sm:p-2 hover:bg-gray-50 rounded-lg transition-colors h-full"
    >
      <div className="flex flex-col h-full">
        <NovelCover 
          coverUrl={novel.coverImageUrl} 
          title={novel.title}
          isPriority={isPriority}
          rating={novel.rating}
          showRating={true}
          status={novel.status}
          showStatus={true}
        />
        <div className="mt-1 sm:mt-2 flex-1 min-h-[3rem] flex flex-col justify-between">
          <h3 className="text-xs sm:text-sm text-black font-medium leading-tight max-h-[2.5rem] line-clamp-2 overflow-hidden">
            {novel.title}
          </h3>
          <NovelStats totalChapters={totalChapters} />
        </div>
      </div>
    </Link>
  );
};

export default NovelCard; 