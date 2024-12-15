'use client';

import Image from 'next/image';
import { Icon } from '@iconify/react';

interface NovelCoverProps {
  coverUrl?: string;
  title: string;
  isPriority?: boolean;
}

const NovelCover = ({ coverUrl, title, isPriority = false }: NovelCoverProps) => (
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

export default NovelCover; 