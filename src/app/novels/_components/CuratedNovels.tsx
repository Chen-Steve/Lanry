'use client';

import Link from 'next/link';
import { Novel } from '@/types/database';
import FloatingElements from './FloatingElements';
import NovelCover from './NovelCover';
import { useRef, useEffect } from 'react';

interface CuratedNovelsProps {
  novels: Novel[];
  className?: string;
}

const CuratedNovels = ({ novels, className = '' }: CuratedNovelsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Add Google Fonts link via useEffect
  useEffect(() => {
    // Create a link element for Google Fonts
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap';
    link.rel = 'stylesheet';
    
    // Add it to the document head
    document.head.appendChild(link);
    
    // Clean up when component unmounts
    return () => {
      document.head.removeChild(link);
    };
  }, []);
  
  if (novels.length === 0) return null;
  
  // Only display the first 6 novels
  const displayNovels = novels.slice(0, 6);

  return (
    <div className={`rounded-lg overflow-hidden ${className}`}>
      <div className="relative px-4 py-2 bg-background">
        <h2 
          style={{ fontFamily: "'Dancing Script', cursive" }} 
          className="text-indigo-600 dark:text-indigo-300 font-bold text-2xl"
        >
          Curated For You
        </h2>
      </div>
      
      <div 
        ref={containerRef}
        className="bg-background p-4 pt-1 pb-2 relative"
        style={{ minHeight: '210px' }}
      >
        {/* Floating elements as background */}
        <div className="absolute inset-0 z-0" style={{ height: '100%', minHeight: '210px' }}>
          <FloatingElements />
        </div>
        
        {/* Scrollable container for mobile, grid for larger screens */}
        <div className="relative z-10">
          <div
            ref={scrollContainerRef}
            className="flex md:grid md:grid-cols-6 md:gap-4 overflow-x-auto md:overflow-x-visible scroll-smooth [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-primary/60 [&::-webkit-scrollbar-track]:bg-accent/30 [&::-webkit-scrollbar-track]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-primary"
          >
            {displayNovels.map((novel) => (
              <Link 
                href={`/novels/${novel.slug}`} 
                key={novel.id}
                className="group/card flex-none w-[120px] sm:w-[160px] md:w-full flex flex-col p-1.5 sm:p-2 bg-card/60 backdrop-blur-sm hover:bg-accent/60 transition-colors rounded-md mr-2 md:mr-0"
              >
                <div className="w-full aspect-[2/3] relative rounded-sm overflow-hidden mb-1.5">
                  <NovelCover
                    coverUrl={novel.coverImageUrl || undefined}
                    title={novel.title}
                    size="small"
                  />
                </div>
                <h3 className="text-xs sm:text-sm font-medium text-foreground line-clamp-2 group-hover/card:text-primary transition-colors text-center">
                  {novel.title}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CuratedNovels; 