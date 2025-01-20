import { formatText } from '@/lib/textFormatting';
import Image from 'next/image';
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

const DescriptionModal = ({ description, isOpen, onClose, characters = [] }: { 
  description: string, 
  isOpen: boolean, 
  onClose: () => void,
  characters: Character[]
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Synopsis</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Close description"
          >
            <Icon icon="mdi:close" className="text-xl" />
          </button>
        </div>

        {/* Characters Grid */}
        {characters && characters.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Characters</h4>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {characters.map((character) => (
                <div
                  key={character.id}
                  className="relative bg-white dark:bg-gray-800 overflow-hidden rounded-lg border border-border"
                >
                  <div className="aspect-[3/4] relative">
                    <Image
                      src={character.imageUrl}
                      alt={character.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 25vw, (max-width: 768px) 12.5vw, 10vw"
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

        {/* Description */}
        <div 
          className="prose prose-sm max-w-none text-muted-foreground dark:prose-invert [&>p]:mb-4 [&>p:last-child]:mb-0 whitespace-pre-line"
          dangerouslySetInnerHTML={{ __html: formatText(description) }}
        />
      </div>
    </div>
  );
};

export const NovelSynopsis = ({
  description,
  characters = [],
}: NovelSynopsisProps) => {
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const truncateLength = isMobile ? 150 : 300;
  const truncatedDescription = description ? description.slice(0, truncateLength) : '';
  const shouldShowMoreButton = description && description.length > truncateLength;

  // Update truncation when window resizes
  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth < 640;
      if (newIsMobile !== isMobile) {
        // Force re-render when switching between mobile and desktop
        setShowDescriptionModal(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  return (
    <>
      <div 
        className="prose prose-sm max-w-none text-muted-foreground dark:prose-invert [&>p]:mb-4 [&>p:last-child]:mb-0 whitespace-pre-line"
        dangerouslySetInnerHTML={{ __html: formatText(truncatedDescription) }}
      />
      {shouldShowMoreButton && (
        <button
          onClick={() => setShowDescriptionModal(true)}
          className="text-sm text-primary hover:text-primary/80 font-medium mt-2"
        >
          Read More
        </button>
      )}

      <DescriptionModal
        description={description}
        characters={characters}
        isOpen={showDescriptionModal}
        onClose={() => setShowDescriptionModal(false)}
      />
    </>
  );
}; 