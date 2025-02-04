import { Novel } from '@/types/database';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import NovelCover from './NovelCover';
import { useEffect, useState } from 'react';

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
      <div className="flex items-center gap-2.5 px-4 mb-3">
        <div className="relative">
          <Icon icon="solar:fire-bold" className="text-2xl text-red-500" />
        </div>
        <h2 className="text-xl font-semibold border-b-2 border-primary pb-1">Most Popular</h2>
      </div>
      <Link
        href={`/novels/${novels[featuredIndex].slug}`}
        className="group relative flex flex-col sm:flex-row gap-4 p-4 bg-card hover:bg-accent/50 rounded-lg transition-colors h-full touch-pan-y overflow-hidden"
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
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${novels[featuredIndex].coverImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(8px)',
            transform: 'scale(1.05)', // Reduced scale for more detail
          }}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/70 to-transparent" />

        {/* Content */}
        <div className="relative z-10 flex flex-col sm:flex-row gap-4 w-full">
          {/* Left Arrow */}
          <button 
            onClick={(e) => {
              e.preventDefault();
              setIsAutoRotationPaused(true);
              setFeaturedIndex(prev => prev === 0 ? novels.length - 1 : prev - 1);
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full"
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
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full"
            aria-label="Next novel"
          >
            <Icon icon="mdi:chevron-right" className="text-xl" />
          </button>

          <div className="w-full sm:w-48 aspect-[3/4] relative rounded-md overflow-hidden">
            <NovelCover
              coverUrl={novels[featuredIndex].coverImageUrl}
              title={novels[featuredIndex].title}
              isPriority={true}
              size="medium"
            />
          </div>
          
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex-1 min-h-0">
              <h3 className="text-lg font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-3">
                {novels[featuredIndex].title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-4 overflow-hidden leading-relaxed">
                {novels[featuredIndex].description}
              </p>
            </div>
            <div className="flex justify-center gap-1.5 mt-4">
              {novels.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.preventDefault();
                    setIsAutoRotationPaused(true);
                    setFeaturedIndex(idx);
                  }}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-200 border-2 ${
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