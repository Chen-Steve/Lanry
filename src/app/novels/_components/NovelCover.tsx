'use client';

import Image from 'next/image';
import { Icon } from '@iconify/react';

interface NovelCoverProps {
  coverUrl?: string;
  title: string;
  isPriority?: boolean;
  rating?: number;
  showRating?: boolean;
  status?: string;
  showStatus?: boolean;
}

const NovelCover = ({ 
  coverUrl, 
  title, 
  isPriority = false,
  rating = 0,
  showRating = false,
  status = '',
  showStatus = false
}: NovelCoverProps) => (
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
    
    {showRating && (
      <div className="absolute bottom-0 left-0 bg-black/70 flex items-center justify-center gap-0.5 h-5 w-10 rounded-tr-lg">
        <Icon icon="pepicons-print:star-filled" className="text-amber-400 text-[10px]" />
        <span className="text-white text-[10px] font-medium">
          {rating > 0 ? rating.toFixed(1) : 'N/A'}
        </span>
      </div>
    )}

    {showStatus && status && (
      <div className="absolute bottom-0 right-0 bg-black/70 flex items-center justify-center h-5 w-12 rounded-tl-lg">
        <span className="text-white text-[10px] font-medium capitalize">
          {status.toLowerCase()}
        </span>
      </div>
    )}
  </div>
);

export default NovelCover; 