'use client';

import { Novel } from '@/types/database';
import Link from 'next/link';
import Image from 'next/image';
import { getNovels } from '@/services/novelService';
import { useEffect, useState } from 'react';
import NoticeBoard from './NoticeBoard';
import { Icon } from '@iconify/react';
import { getTotalChapters } from '@/services/chapterService';

const NovelCard = ({ novel, isPriority = false }: { novel: Novel; isPriority?: boolean }) => {
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
    <Link href={`/novels/${novel.slug}`} className="block">
      <div className="flex flex-col items-center text-center p-2">
        <div className="w-24 h-32 sm:w-32 sm:h-44 relative mb-2">
          {novel.coverImageUrl ? (
            <Image
              src={`/novel-covers/${novel.coverImageUrl}`}
              alt={`Cover for ${novel.title}`}
              fill
              priority={isPriority}
              loading={isPriority ? 'eager' : 'lazy'}
              className="object-cover rounded"
              sizes="(max-width: 768px) 96px, 128px"
            />
          ) : (
            <div className="w-full h-full bg-gray-300 rounded"></div>
          )}
        </div>
        <div className="w-full">
          <h3 className="text-sm sm:text-base font-semibold truncate text-black leading-tight">
            {novel.title}
          </h3>
          <div className="flex items-center justify-center gap-1 text-xs text-gray-600 mt-1">
            <Icon icon="mdi:book-open-page-variant" className="text-base" />
            <span>{totalChapters} Chapters</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

const NovelListing = () => {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNovels = async () => {
      try {
        const data = await getNovels();
        setNovels(data);
      } catch (error) {
        console.error('Error fetching novels:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNovels();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-4">
      <NoticeBoard />
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
        {novels.map((novel, index) => (
          <NovelCard 
            key={novel.id} 
            novel={novel}
            isPriority={index < 3}
          />
        ))}
      </div>
    </div>
  );
};

export default NovelListing;