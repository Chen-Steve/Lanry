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
  <div className="relative aspect-[2/3] w-full rounded overflow-hidden bg-muted group">
    {coverUrl ? (
      <Image
        src={coverUrl.startsWith('http') ? coverUrl : `/novel-covers/${coverUrl}`}
        alt={`Cover for ${title}`}
        fill
        priority={isPriority}
        loading={isPriority ? 'eager' : 'lazy'}
        className="object-cover transition-transform group-hover:scale-105"
        sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 16vw"
      />
    ) : (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <Icon icon="pepicons-print:book" className="text-3xl text-muted-foreground" />
      </div>
    )}
    
    {(showRating || (showStatus && status)) && (
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-6 pb-1.5 px-1.5 sm:pt-8 sm:pb-2 sm:px-2 transition-opacity group-hover:opacity-100">
        <div className="flex items-center justify-between gap-1.5 sm:gap-2">
          {showRating && (
            <div className="flex items-center gap-0.5 sm:gap-1">
              <Icon icon="pepicons-print:star-filled" className="text-amber-400 text-[10px] sm:text-sm" />
              <span className="text-white text-[10px] sm:text-xs font-medium">
                {rating > 0 ? rating.toFixed(1) : 'N/A'}
              </span>
            </div>
          )}
          
          {showStatus && status && (
            <span className="text-[10px] sm:text-xs font-medium text-white/90 capitalize px-1.5 py-0.5 sm:px-2 rounded-full bg-white/10 backdrop-blur-[2px]">
              {status.toLowerCase()}
            </span>
          )}
        </div>
      </div>
    )}
  </div>
);

export default NovelCover; 