import { formatText } from '@/lib/textFormatting';
import { Icon } from '@iconify/react';
import { useState, useEffect } from 'react';

interface Character {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
  description?: string | null;
  orderIndex: number;
}

interface NovelSynopsisProps {
  description: string;
  characters?: Character[];
}

export const NovelSynopsis = ({
  description,
  characters = [],
}: NovelSynopsisProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const truncateLength = isMobile ? 150 : 300;

  // Clean and truncate text function
  const getTruncatedText = (text: string) => {
    // Clean up excessive whitespace while preserving basic paragraph structure
    const cleanText = text.replace(/\n\s*\n/g, '\n\n').trim();
    
    // If expanded, return the full cleaned text
    if (isExpanded) return cleanText;

    // Find the first paragraph
    const firstParagraphEnd = cleanText.indexOf('\n\n');
    
    // If there's only one paragraph or no paragraphs found
    if (firstParagraphEnd === -1) {
      // If the text is shorter than truncateLength, return it all
      if (cleanText.length <= truncateLength) return cleanText;
      
      // Otherwise truncate at the last sentence within truncateLength
      const truncated = cleanText.slice(0, truncateLength);
      const lastPeriod = truncated.lastIndexOf('.', truncateLength);
      return lastPeriod > 0 ? cleanText.slice(0, lastPeriod + 1) : truncated;
    }

    // Return just the first paragraph
    return cleanText.slice(0, firstParagraphEnd);
  };

  const shouldShowButton = description.length > truncateLength || description.includes('\n\n');
  const displayText = getTruncatedText(description);

  // Update truncation when window resizes
  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth < 640;
      if (newIsMobile !== isMobile) {
        setIsExpanded(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  // Function to append size parameters to Supabase URLs
  const getOptimizedImageUrl = (url: string) => {
    if (url.includes('supabase')) {
      // For mobile (4 columns): 25vw of viewport width, max ~150px
      // For tablet (6 columns): 12.5vw of viewport width, max ~120px
      // For desktop: 10vw of viewport width, max ~100px
      // Using 150x200 as the largest size needed
      return `${url}?width=150&height=200&resize=contain`;
    }
    return url;
  };

  return (
    <div>
      {/* Description */}
      <div className="relative">
        <div 
          className="prose prose-sm max-w-none text-black dark:text-white dark:prose-invert [&>p]:mb-4 [&>p:last-child]:mb-0 whitespace-pre-line"
          dangerouslySetInnerHTML={{ 
            __html: formatText(displayText)
          }}
        />
        
        {shouldShowButton && !isExpanded && (
          <div className="relative">
            <div className="w-full border-t border-black/20 dark:border-white/20 -mb-[1px]"></div>
            <div className="flex justify-center">
              <button
                onClick={() => setIsExpanded(true)}
                className="flex items-center text-xs text-primary hover:text-primary/80 font-medium border border-black/20 dark:border-white/20 px-2 py-1 rounded-b-md bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <span>Show {characters.length > 0 ? 'Characters' : 'More'}</span>
                <Icon 
                  icon="mdi:chevron-down"
                  className="w-3.5 h-3.5" 
                />
              </button>
            </div>
          </div>
        )}

        {shouldShowButton && isExpanded && (
          <>
            {/* Characters Grid - Only show when expanded */}
            {characters.length > 0 && (
              <div className="mt-6 mb-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Characters</h4>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {characters.map((character) => (
                    <div
                      key={character.id}
                      className="relative bg-white dark:bg-gray-800 overflow-hidden rounded-lg border border-border"
                    >
                      <div className="aspect-[3/4] relative">
                        <img
                          src={getOptimizedImageUrl(character.imageUrl)}
                          alt={character.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1">
                          <p className="text-xs font-medium text-white leading-tight truncate">
                            {character.name}
                          </p>
                          <p className="text-[10px] text-gray-300 leading-tight truncate">
                            {character.role}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button
              onClick={() => setIsExpanded(false)}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium mt-4 mb-8 border border-black/20 dark:border-white/20 px-2 py-1 rounded-md bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <span>Show Less</span>
              <Icon 
                icon="mdi:chevron-up"
                className="w-3.5 h-3.5" 
              />
            </button>
          </>
        )}
      </div>
    </div>
  );
}; 