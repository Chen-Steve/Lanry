'use client';

import { Novel } from '@/types/database';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import NovelCover from './NovelCover';
import { useEffect, useState } from 'react';
import { formatText } from '@/lib/textFormatting';

const FeaturedNovel = () => {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isAutoRotationPaused, setIsAutoRotationPaused] = useState(false);

  // Minimum swipe distance in pixels
  const minSwipeDistance = 50;

  useEffect(() => {
    const fetchTopNovels = async () => {
      try {
        const response = await fetch('/api/novels/top');
        if (!response.ok) throw new Error('Failed to fetch top novels');
        const data = await response.json();
        setNovels(data);
      } catch (err) {
        console.error('Error fetching top novels:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopNovels();
  }, []);

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

  if (isLoading) {
    return (
      <div className="col-span-2 sm:col-span-2 md:col-span-3 lg:col-span-3 flex items-center justify-center min-h-[200px] sm:min-h-[280px] bg-card rounded-lg">
        <Icon icon="eos-icons:loading" className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (novels.length === 0) return null;

  return (
    <div className="col-span-2 sm:col-span-2 md:col-span-3 lg:col-span-3 flex flex-col">
      <Link
        href={`/novels/${novels[featuredIndex].slug}`}
        className="group relative flex flex-row gap-4 p-6 sm:p-8 bg-card hover:bg-accent/50 rounded-lg transition-colors touch-pan-y overflow-hidden min-h-[200px] sm:min-h-[280px]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          if (touchStart && touchEnd && Math.abs(touchStart - touchEnd) > minSwipeDistance) {
            e.preventDefault();
          }
        }}
      >
        {/* Background Cover Image */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${novels[featuredIndex].coverImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(4px)',
            transform: 'scale(1.05)',
          }}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-black/30 to-black/20" />

        {/* Content */}
        <div className="relative z-10 flex flex-row gap-6 sm:gap-8 w-full items-center">
          {/* Left Arrow */}
          <button 
            onClick={(e) => {
              e.preventDefault();
              setIsAutoRotationPaused(true);
              setFeaturedIndex(prev => prev === 0 ? novels.length - 1 : prev - 1);
            }}
            className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full"
            aria-label="Previous novel"
          >
            <Icon icon="mdi:chevron-left" className="text-xl" />
          </button>

          {/* Right Arrow */}
          <button 
            onClick={(e) => {
              e.preventDefault();
              setIsAutoRotationPaused(true);
              setFeaturedIndex(prev => prev === novels.length - 1 ? 0 : prev + 1);
            }}
            className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full"
            aria-label="Next novel"
          >
            <Icon icon="mdi:chevron-right" className="text-xl" />
          </button>

          <div className="w-32 sm:w-36 aspect-[3/4] relative rounded-md overflow-hidden shrink-0">
            <NovelCover
              coverUrl={novels[featuredIndex].coverImageUrl}
              title={novels[featuredIndex].title}
              isPriority={true}
              size="medium"
            />
          </div>
          
          <div className="flex-1 min-w-0 flex flex-col h-full max-w-2xl py-1">
            <h3 className="text-lg sm:text-2xl font-semibold text-white transition-colors mb-3 sm:mb-4 line-clamp-2">
              {novels[featuredIndex].title}
            </h3>

            {/* Synopsis */}
            <div className="relative h-[64px] sm:h-[72px]">
              <div 
                className="prose prose-sm max-w-none text-white/90 dark:prose-invert line-clamp-3 whitespace-pre-line"
                dangerouslySetInnerHTML={{ 
                  __html: formatText(novels[featuredIndex].description) 
                }}
              />
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent" />
            </div>

            {/* Navigation Dots */}
            <div className="flex justify-center gap-1.5 mt-auto pt-2">
              {novels.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.preventDefault();
                    setIsAutoRotationPaused(true);
                    setFeaturedIndex(idx);
                  }}
                  className={`w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full transition-all duration-200 border sm:border-2 ${
                    idx === featuredIndex 
                      ? 'bg-primary border-black dark:border-white scale-110' 
                      : 'bg-muted-foreground/40 hover:bg-muted-foreground/60 hover:scale-105 border-black dark:border-white'
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