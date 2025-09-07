import { formatText } from '@/lib/textFormatting';
import { Icon } from '@iconify/react';
import { useState } from 'react';

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
    
    if (isExpanded) return cleanText;
    
    // If the text is shorter than truncateLength, return it all
    if (cleanText.length <= truncateLength) return cleanText;
    
    // Otherwise truncate at the last sentence within truncateLength and add ellipsis
    const truncated = cleanText.slice(0, truncateLength);
    const lastPeriod = truncated.lastIndexOf('.', truncateLength);
    return lastPeriod > 0 ? cleanText.slice(0, lastPeriod + 1) + '...' : truncated + '...';
  };

  const displayText = getTruncatedText(description);
  const shouldShowArrow = description.length > truncateLength;

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
        
        {shouldShowArrow && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors mt-2"
            aria-label={isExpanded ? "Show less" : "Show more"}
          >
            <span className="text-sm">{isExpanded ? "Show less" : "Show more"}</span>
            <Icon 
              icon={isExpanded ? "mdi:chevron-up" : "mdi:chevron-down"}
              className="w-5 h-5" 
            />
          </button>
        )}
        
        {/* Characters Grid */}
        {characters.length > 0 && (
          <div className="mt-6 mb-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Characters</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {characters.map((character) => (
                <div
                  key={character.id}
                  className="bg-white dark:bg-gray-800 overflow-hidden rounded-lg border border-border"
                >
                  <div className="aspect-[3/4] relative">
                    <img
                      src={getOptimizedImageUrl(character.imageUrl)}
                      alt={character.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {character.name}
                    </p>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 truncate">
                      {character.role}
                    </p>
                    {character.description && (
                      <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 whitespace-pre-line">
                        {character.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 