'use client';

import Image from 'next/image';
import { Icon } from '@iconify/react';
import { getResponsiveImageUrl } from '@/services/imageService';

interface NovelCoverProps {
  coverUrl?: string;
  title: string;
  isPriority?: boolean;
  rating?: number;
  showRating?: boolean;
  status?: string;
  showStatus?: boolean;
  hasChapters?: boolean;
  contentType?: 'BL' | 'GL';
  category?: 'yaoi' | 'yuri';
  size?: 'thumbnail' | 'small' | 'medium' | 'large';
}

const NovelCover = ({ 
  coverUrl, 
  title, 
  isPriority = false,
  rating = 0,
  showRating = false,
  status = '',
  showStatus = false,
  hasChapters = true,
  contentType,
  category,
  size = 'small'
}: NovelCoverProps) => (
  <div className="relative aspect-[2/3] w-full rounded overflow-hidden bg-muted group">
    {coverUrl ? (
      <Image
        src={coverUrl.startsWith('http') ? getResponsiveImageUrl(coverUrl, size) : `/novel-covers/${coverUrl}`}
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
    
    {!hasChapters && (
      <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/90 via-black/60 to-transparent pb-6 pt-1.5 px-1.5 sm:pb-8 sm:pt-2 sm:px-2">
        <div className="flex items-center justify-center">
          <span className="text-[10px] sm:text-xs font-medium text-white/90 capitalize px-1.5 py-0.5 sm:px-2 rounded-md bg-primary/80 backdrop-blur-[2px]">
            Coming Soon
          </span>
        </div>
      </div>
    )}

    <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 flex flex-col gap-1">
      {contentType && (
        <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md backdrop-blur-[2px] ${
          contentType === 'BL' ? 'bg-blue-500/80' : 'bg-pink-500/80'
        }`}>
          <Icon 
            icon={contentType === 'BL' ? 'ph:heart-duotone' : 'ph:heart-straight-duotone'} 
            className="text-white text-[10px] sm:text-sm" 
          />
          <span className="text-white text-[10px] sm:text-xs font-medium">
            {contentType}
          </span>
        </div>
      )}
      
      {category && (
        <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md backdrop-blur-[2px] ${
          category === 'yaoi' ? 'bg-violet-500/80' : 'bg-rose-400/80'
        }`}>
          <Icon 
            icon={category === 'yaoi' ? 'ph:sparkle-duotone' : 'ph:flower-lotus-duotone'} 
            className="text-white text-[10px] sm:text-sm" 
          />
          <span className="text-white text-[10px] sm:text-xs font-medium capitalize">
            {category}
          </span>
        </div>
      )}
    </div>

    {showRating && hasChapters && (
      <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2">
        <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-[2px]">
          <Icon icon="material-symbols:star" className="text-amber-400 text-[10px] sm:text-sm" />
          <span className="text-white text-[10px] sm:text-xs font-medium">
            {rating > 0 ? rating.toFixed(1) : 'N/A'}
          </span>
        </div>
      </div>
    )}
    
    {showStatus && status && (
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-6 pb-1.5 px-1.5 sm:pt-8 sm:pb-2 sm:px-2">
        <div className="flex items-center justify-end">
          <span className="text-[10px] sm:text-xs font-medium text-white/90 capitalize px-1.5 py-0.5 sm:px-2 rounded-md bg-white/10 backdrop-blur-[2px]">
            {status.toLowerCase()}
          </span>
        </div>
      </div>
    )}
  </div>
);

export default NovelCover; 