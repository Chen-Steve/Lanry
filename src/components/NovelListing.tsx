'use client';

import { Novel } from '@/types/database';
import Link from 'next/link';
import Image from 'next/image';
import { getNovels } from '@/services/novelService';
import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';

interface LatestChapter {
  chapter_number: number;
  title: string;
}

const truncateText = (text: string, maxLength: number) => {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
};

const NovelCard = ({ novel, isPriority = false }: { novel: Novel; isPriority?: boolean }) => {
  const [latestChapter, setLatestChapter] = useState<LatestChapter | null>(null);

  useEffect(() => {
    const fetchLatestChapter = async () => {
      const { data, error } = await supabase
        .from('chapters')
        .select('chapter_number, title')
        .eq('novel_id', novel.id)
        .lte('publish_at', new Date().toISOString()) // Only published chapters
        .order('chapter_number', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setLatestChapter(data);
      }
    };

    fetchLatestChapter();
  }, [novel.id]);

  return (
    <Link href={`/novels/${novel.slug}`} className="block">
      <div className="flex flex-row gap-4">
        <div className="w-28 h-44 flex-shrink-0 relative">
          {novel.coverImageUrl ? (
            <Image
              src={`/novel-covers/${novel.coverImageUrl}`}
              alt={`Cover for ${novel.title}`}
              fill
              priority={isPriority}
              loading={isPriority ? 'eager' : 'lazy'}
              className="object-cover rounded"
              sizes="(max-width: 768px) 112px, 112px"
            />
          ) : (
            <div className="w-full h-full bg-gray-300 rounded"></div>
          )}
        </div>
        <div className="flex-grow overflow-hidden h-44 flex flex-col">
          <h3 className="text-lg font-semibold truncate text-black">{novel.title}</h3>
          {novel.translator?.username && (
            <p className="text-sm text-gray-600">
              By: {novel.translator.username}
            </p>
          )}
          <p className="text-xs text-gray-500 line-clamp-3 mt-1 flex-grow">
            {truncateText(novel.description, 150)}
          </p>
          {latestChapter && (
            <p className="text-xs text-gray-600 mt-1 truncate">
              Latest: Chapter {latestChapter.chapter_number}
              {latestChapter.title && ` - ${truncateText(latestChapter.title, 30)}`}
            </p>
          )}
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
    <div className="max-w-5xl mx-auto px-4 relative">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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