'use client';

import { Icon } from '@iconify/react';
import Image from 'next/image';
import { getResponsiveImageUrl } from '@/services/imageService';

interface NovelCoverProps {
  coverUrl?: string;
  title: string;
  status?: string;
  showStatus?: boolean;
  hasChapters?: boolean;
  contentType?: 'BL' | 'GL';
  category?: 'yaoi' | 'yuri';
  size?: 'thumbnail' | 'small' | 'medium' | 'large';
  chapterCount?: number;
  isPriority?: boolean;
}

const NovelCover = ({ 
  coverUrl, 
  title, 
  status = '',
  showStatus = false,
  hasChapters = true,
  contentType,
  category,
  size = 'small',
  chapterCount,
  isPriority = false
}: NovelCoverProps) => {
  const imageUrl = coverUrl?.startsWith('http') 
    ? getResponsiveImageUrl(coverUrl, size)
    : coverUrl ? `/novel-covers/${coverUrl}` : null;

  return (
    <div className="relative aspect-[2/3] w-full rounded overflow-hidden bg-muted group">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={`Cover for ${title}`}
          fill
          sizes={`(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw`}
          className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
          priority={isPriority}
          quality={size === 'thumbnail' ? 60 : size === 'small' ? 75 : 85}
          loading={isPriority ? "eager" : "lazy"}
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

      <div className="absolute left-0 top-0 flex flex-col items-start gap-1 p-1.5 sm:p-2">
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

      {(showStatus || (typeof chapterCount === 'number' && chapterCount > 0)) && hasChapters && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-6 pb-1.5 px-1.5 sm:pt-8 sm:pb-2 sm:px-2">
          <div className="flex items-center justify-between">
            {typeof chapterCount === 'number' && chapterCount > 0 && (
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/10 backdrop-blur-[2px]">
                <Icon icon="pepicons-print:book" className="text-white text-[10px] sm:text-sm" />
                <span className="text-white text-[10px] sm:text-xs font-medium">
                  {chapterCount}
                </span>
              </div>
            )}
            {showStatus && (
              <span className="text-[10px] sm:text-xs font-medium text-white/90 capitalize px-1.5 py-0.5 sm:px-2 rounded-md bg-white/10 backdrop-blur-[2px]">
                {status.toLowerCase()}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NovelCover; 