'use client';

import { Novel } from '@/types/database';
import Link from 'next/link';
import Image from 'next/image';

const NovelCard = ({ novel, isPriority = false }: { novel: Novel; isPriority?: boolean }) => (
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
      <div className="flex-grow overflow-hidden h-44">
        <h3 className="text-lg font-semibold mb-1 truncate text-black">{novel.title}</h3>
        <p className="text-sm text-gray-600 mb-2">by {novel.author}</p>
        <p className="text-sm text-gray-500 line-clamp-5 leading-relaxed">{novel.description}</p>
      </div>
    </div>
  </Link>
);

const NovelListing = ({ novels }: { novels: Novel[] }) => {
  return (
    <div className="max-w-5xl mx-auto px-4">
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
