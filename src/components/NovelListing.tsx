'use client';

import { Novel } from '@/types/database';
import Link from 'next/link';
import Image from 'next/image';
import { getNovels } from '@/services/novelService';
import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { getTotalChapters } from '@/services/chapterService';

const NovelCover = ({ 
  coverUrl, 
  title, 
  isPriority 
}: { 
  coverUrl?: string; 
  title: string;
  isPriority?: boolean;
}) => (
  <div className="relative aspect-[2/3] w-full rounded overflow-hidden bg-gray-200">
    {coverUrl ? (
      <Image
        src={`/novel-covers/${coverUrl}`}
        alt={`Cover for ${title}`}
        fill
        priority={isPriority}
        loading={isPriority ? 'eager' : 'lazy'}
        className="object-cover transition-transform hover:scale-105"
        sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 16vw"
      />
    ) : (
      <div className="w-full h-full flex items-center justify-center bg-gray-200">
        <Icon icon="pepicons-print:book" className="text-3xl text-gray-400" />
      </div>
    )}
  </div>
);

const NovelStats = ({ totalChapters }: { totalChapters: number }) => (
  <div className="flex items-center gap-1 text-xs text-gray-600">
    <Icon icon="pepicons-print:book" className="text-sm" />
    <span>{totalChapters} Ch.</span>
  </div>
);

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
    <Link 
      href={`/novels/${novel.slug}`} 
      className="block p-2 hover:bg-gray-50 rounded-lg transition-colors h-full"
    >
      <div className="flex flex-col h-full">
        <NovelCover 
          coverUrl={novel.coverImageUrl} 
          title={novel.title}
          isPriority={isPriority}
        />
        <div className="mt-2 flex-1 min-h-[3.5rem] flex flex-col justify-between">
          <h3 className="text-sm text-black font-medium leading-tight max-h-[2.5rem] line-clamp-2 overflow-hidden">
            {novel.title}
          </h3>
          <NovelStats totalChapters={totalChapters} />
        </div>
      </div>
    </Link>
  );
};

const LoadingGrid = () => (
  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
    {[...Array(12)].map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="aspect-[2/3] bg-gray-200 rounded" />
        <div className="mt-2 h-4 bg-gray-200 rounded w-3/4" />
        <div className="mt-1 h-3 bg-gray-200 rounded w-1/2" />
      </div>
    ))}
  </div>
);

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
    return (
      <div className="max-w-5xl mx-auto px-4">
        <LoadingGrid />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4">
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {novels.map((novel, index) => (
          <NovelCard 
            key={novel.id} 
            novel={novel}
            isPriority={index < 6}
          />
        ))}
      </div>
    </div>
  );
};

export default NovelListing;