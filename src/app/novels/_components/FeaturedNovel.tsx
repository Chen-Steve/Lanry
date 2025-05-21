'use client';

import { Novel } from '@/types/database';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import NovelCover from './NovelCover';
import { useEffect, useState } from 'react';
import { formatText } from '@/lib/textFormatting';

interface FeaturedNovelProps {
  novels: Novel[];
}

const FeaturedNovel = ({ novels }: FeaturedNovelProps) => {
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isAutoRotationPaused, setIsAutoRotationPaused] = useState(false);

  // Minimum swipe distance in pixels
  const minSwipeDistance = 50;

  useEffect(() => {
    // Auto-rotate featured novels every 5 seconds if not paused
    const interval = setInterval(() => {
      if (!isAutoRotationPaused && novels.length > 0) {
        setFeaturedIndex(prev => prev === novels.length - 1 ? 0 : prev + 1);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [novels.length, isAutoRotationPaused]);

  // Reset auto-rotation after 10 seconds of no interaction
  useEffect(() => {
    if (isAutoRotationPaused) {
      const timeout = setTimeout(() => {
        setIsAutoRotationPaused(false);
      }, 10000);

      return () => clearTimeout(timeout);
    }
  }, [isAutoRotationPaused]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsAutoRotationPaused(true);
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      setFeaturedIndex(prev => 
        prev === novels.length - 1 ? 0 : prev + 1
      );
    }
    if (isRightSwipe) {
      setFeaturedIndex(prev => 
        prev === 0 ? novels.length - 1 : prev - 1
      );
    }
  };

  if (novels.length === 0) return null;

  return (
    <div className="col-span-2 sm:col-span-2 md:col-span-3 lg:col-span-3 flex flex-col">
      <Link
        href={`/novels/${novels[featuredIndex].slug}`}
        className="group relative flex flex-row gap-4 p-2 sm:p-2 hover:bg-accent/20 rounded-lg transition-colors touch-pan-y overflow-hidden min-h-[200px] sm:min-h-[300px] bg-[#f7f3ec] dark:bg-zinc-900"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          if (touchStart && touchEnd && Math.abs(touchStart - touchEnd) > minSwipeDistance) {
            e.preventDefault();
          }
        }}
      >
        {/* Content */}
        <div className="relative z-10 flex flex-row gap-4 w-full items-start">
          {/* Left Arrow */}
          <button 
            onClick={(e) => {
              e.preventDefault();
              setIsAutoRotationPaused(true);
              setFeaturedIndex(prev => prev === 0 ? novels.length - 1 : prev - 1);
            }}
            className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full"
            aria-label="Previous novel"
          >
            <Icon icon="mdi:chevron-left" className="text-2xl" />
          </button>

          {/* Right Arrow */}
          <button 
            onClick={(e) => {
              e.preventDefault();
              setIsAutoRotationPaused(true);
              setFeaturedIndex(prev => prev === novels.length - 1 ? 0 : prev + 1);
            }}
            className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full"
            aria-label="Next novel"
          >
            <Icon icon="mdi:chevron-right" className="text-2xl" />
          </button>

          <div className="w-24 sm:w-40 aspect-[3/4] relative rounded-md overflow-hidden shrink-0">
            <NovelCover
              coverUrl={novels[featuredIndex].coverImageUrl}
              title={novels[featuredIndex].title}
              size="medium"
            />
          </div>
          
          <div className="flex-1 min-w-0 flex flex-col h-full">
            <h3 className="text-lg sm:text-2xl font-semibold text-black dark:text-white transition-colors mb-2 sm:mb-4 line-clamp-2">
              {novels[featuredIndex].title}
            </h3>

            {/* Synopsis */}
            <div className="h-[80px] sm:h-[120px] overflow-hidden">
              <div 
                className="prose prose-sm sm:prose-lg max-w-none text-black dark:text-white dark:prose-invert line-clamp-3 sm:line-clamp-4 whitespace-pre-line"
                dangerouslySetInnerHTML={{ 
                  __html: formatText(novels[featuredIndex].description) 
                }}
              />
            </div>

            {/* Navigation Dots */}
            <div className="flex justify-center gap-2 sm:gap-3 mt-auto pt-2 sm:pt-4">
              {novels.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.preventDefault();
                    setIsAutoRotationPaused(true);
                    setFeaturedIndex(idx);
                  }}
                  className={`w-2 sm:w-3 h-2 sm:h-3 rounded-full transition-all duration-200 border border-black ${
                    idx === featuredIndex 
                      ? 'bg-primary scale-110' 
                      : 'bg-muted-foreground/40 hover:bg-muted-foreground/60 hover:scale-105'
                  }`}
                  aria-label={`Show featured novel ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default FeaturedNovel;