'use client';

import { Novel } from '@/types/database';
import Link from 'next/link';
import Image from 'next/image';

const NovelCard = ({ novel }: { novel: Novel }) => (
  <Link href={`/novels/${novel.slug}`} className="block">
    <div className="flex flex-row border p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 gap-4">
      <div className="w-32 h-40 flex-shrink-0 relative">
        {novel.coverImageUrl ? (
          <Image
            src={`/novel-covers/${novel.coverImageUrl}`}
            alt={`Cover for ${novel.title}`}
            fill
            className="object-cover rounded"
            sizes="(max-width: 768px) 128px, 128px"
          />
        ) : (
          <div className="w-full h-full bg-gray-300 rounded"></div>
        )}
      </div>
      <div className="flex-grow overflow-hidden">
        <h3 className="text-lg font-semibold mb-2 truncate">{novel.title}</h3>
        <p className="text-sm text-gray-600 mb-2">by {novel.author}</p>
        <p className="text-sm text-gray-500 line-clamp-3">{novel.description}</p>
      </div>
    </div>
  </Link>
);

const NovelListing = ({ novels }: { novels: Novel[] }) => {
  return (
    <div className="max-w-5xl mx-auto px-4">
      {/* Novel Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {novels.map((novel) => (
          <NovelCard key={novel.id} novel={novel} />
        ))}
      </div>
    </div>
  );
};

export default NovelListing;
