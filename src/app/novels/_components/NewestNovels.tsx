import Link from 'next/link';
import NovelCover from './NovelCover';
import { useRef, useEffect } from 'react';

interface NewestNovel {
  id: string;
  slug: string;
  title: string;
  coverImageUrl: string | null;
  createdAt: string; // ISO date string for when the novel was created
}

interface NewReleasesProps {
  recentNovels: NewestNovel[];
  className?: string;
}

const NewReleases = ({ recentNovels, className = '' }: NewReleasesProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Sort novels by creation date, newest first
  const sortedNovels = [...recentNovels].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Add Google Fonts link via useEffect
  useEffect(() => {
    // Create a link element for Google Fonts
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap';
    link.rel = 'stylesheet';
    
    // Add it to the document head if it doesn't already exist
    if (!document.head.querySelector('link[href*="Dancing+Script"]')) {
      document.head.appendChild(link);
    }
    
    // No need to clean up as other components may still need it
  }, []);

  if (recentNovels.length === 0) return null;

  return (
    <div className={`mt-2 w-full max-w-[95%] mx-auto ${className}`}>
      <div className="flex items-center mb-2">
        <h2 
          style={{ fontFamily: "'Dancing Script', cursive" }} 
          className="text-indigo-600 dark:text-indigo-300 font-bold text-2xl"
        >
          Newest Novels
        </h2>
      </div>

      <div className="bg-[#f7f3ec] dark:bg-zinc-900 rounded-lg p-4">
        {/* Carousel Container */}
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-primary/60 [&::-webkit-scrollbar-track]:bg-accent/30 [&::-webkit-scrollbar-track]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-primary"
        >
          {sortedNovels.map(novel => (
              <Link
                key={novel.id}
                href={`/novels/${novel.slug}`}
                className="group/card flex-none w-[120px] sm:w-[160px] flex flex-col p-1.5 sm:p-2 hover:bg-accent/20 transition-colors"
              >
                <div className="w-full aspect-[2/3] relative rounded-sm overflow-hidden mb-1.5">
                  <NovelCover
                    coverUrl={novel.coverImageUrl || undefined}
                    title={novel.title}
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
  );
};

export default NewReleases; 