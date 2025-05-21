'use client';

import Link from 'next/link';
import { Novel } from '@/types/database';
import NovelCover from './NovelCover';
import { useRef, useEffect, useState } from 'react';

interface CuratedNovelsProps {
  novels: Novel[];
  className?: string;
}

const CuratedNovels = ({ novels, className = '' }: CuratedNovelsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectedNovelId, setSelectedNovelId] = useState<string | null>(null);
  const [descriptionCache, setDescriptionCache] = useState<Record<string, string>>({});
  const [isLoadingDescription, setIsLoadingDescription] = useState<boolean>(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(false);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 640); // sm breakpoint
    };
    
    // Set initial value
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
  
  // Display more novels on desktop
  const displayNovels = novels.slice(0, isDesktop ? 9 : 6);

  // Automatically select and fetch description for the first novel on mount
  useEffect(() => {
    if (displayNovels.length > 0) {
      const firstNovel = displayNovels[0];
      // Only set the first novel as selected if no novel is currently selected
      if (selectedNovelId === null) {
        setSelectedNovelId(firstNovel.id);
        // If the first novel is now selected and its description isn't cached, fetch it.
        if (!descriptionCache[firstNovel.id]) {
          setIsLoadingDescription(true);
          setTimeout(() => {
            const fetchedDescription = `This is a captivating description for "${firstNovel.title}". Dive into a world of adventure, mystery, and romance. Explore the depths of imagination with characters that will stay with you long after you've finished the last page.`;
            setDescriptionCache(prevCache => ({
              ...prevCache,
              [firstNovel.id]: fetchedDescription
            }));
            setIsLoadingDescription(false);
          }, 500);
        }
      } 
      // Additional case: If the first novel is already selected (e.g. by a previous run or SSR)
      // but its description is missing from cache, fetch it.
      else if (selectedNovelId === firstNovel.id && !descriptionCache[firstNovel.id]) {
        setIsLoadingDescription(true);
        setTimeout(() => {
          const fetchedDescription = `This is a captivating description for "${firstNovel.title}". Dive into a world of adventure, mystery, and romance. Explore the depths of imagination with characters that will stay with you long after you've finished the last page.`;
          setDescriptionCache(prevCache => ({
            ...prevCache,
            [firstNovel.id]: fetchedDescription
          }));
          setIsLoadingDescription(false);
        }, 500);
      }
    }
  }, [displayNovels, descriptionCache, selectedNovelId, setIsLoadingDescription, setDescriptionCache]); 
  
  if (novels.length === 0) return null;
  
  const handleNovelClick = (novel: Novel) => {
    // Only proceed if the clicked novel is different from the currently selected one
    if (selectedNovelId !== novel.id) {
      setSelectedNovelId(novel.id);
      if (!descriptionCache[novel.id]) {
        setIsLoadingDescription(true);
        setTimeout(() => {
          const fetchedDescription = `This is a captivating description for "${novel.title}". Dive into a world of adventure, mystery, and romance. Explore the depths of imagination with characters that will stay with you long after you've finished the last page.`;
          setDescriptionCache(prevCache => ({
            ...prevCache,
            [novel.id]: fetchedDescription
          }));
          setIsLoadingDescription(false);
        }, 500);
      }
    }
  };

  return (
    <div className={`rounded-lg ${className}`}>
      <div 
        ref={containerRef}
        className="bg-container rounded-lg relative"
      >
        <div className="p-4">
          <h2 
            style={{ fontFamily: "'Dancing Script', cursive" }} 
            className="text-indigo-600 dark:text-indigo-300 font-bold text-2xl mb-4"
          >
            Curated For You
          </h2>
          
          {/* Scrollable container for mobile, grid for larger screens */}
          <div className="relative z-10">
            <div
              ref={scrollContainerRef}
              className="flex overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-primary/60 [&::-webkit-scrollbar-track]:bg-accent/30 [&::-webkit-scrollbar-track]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-primary"
            >
              {displayNovels.map((novel) => (
                <div
                  onClick={() => handleNovelClick(novel)}
                  key={novel.id}
                  className={`group/card flex-none w-20 sm:w-[calc(6rem+1rem)] flex flex-col p-0.5 sm:p-2 bg-card/60 backdrop-blur-sm hover:bg-accent/60 transition-all duration-200 ease-in-out rounded-md mr-1.5 cursor-pointer`}
                >
                  <div className={`w-full aspect-[2/3] relative rounded-sm overflow-hidden ${selectedNovelId === novel.id ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'}`}>
                    <NovelCover
                      coverUrl={novel.coverImageUrl || undefined}
                      title={novel.title}
                      size="small"
                    />
                  </div>
                </div>
              ))}
            </div>
            {selectedNovelId && (
              <div className="mt-3">
                {isLoadingDescription ? (
                  <p className="text-sm text-foreground/80">Loading description...</p>
                ) : descriptionCache[selectedNovelId] ? (
                  (() => {
                    const selectedNovel = novels.find(n => n.id === selectedNovelId);
                    if (!selectedNovel) return <p className="text-sm text-foreground/80">Novel details not found.</p>;

                    return (
                      <div>
                        <h4 className="text-md font-semibold text-primary mb-1">
                          {selectedNovel.title}
                        </h4>
                        <p className="text-sm text-foreground/90 whitespace-pre-wrap mb-3">
                          {descriptionCache[selectedNovelId]}
                        </p>
                        <Link href={`/novels/${selectedNovel.slug}`} passHref legacyBehavior>
                          <a className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                            Read Novel
                          </a>
                        </Link>
                      </div>
                    );
                  })()
                ) : (
                  <p className="text-sm text-foreground/80">No description available.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CuratedNovels;