import { Icon } from '@iconify/react';
import Link from 'next/link';

interface NovelInfoCardProps {
  novelId: string;
  novelCoverUrl?: string;
  novelTitle?: string;
  onChaptersClick?: () => void;
}

export const NovelInfoCard = ({ 
  novelId, 
  novelCoverUrl, 
  novelTitle,
  onChaptersClick
}: NovelInfoCardProps) => {
  // Process cover URL similar to other components in the codebase
  const imageUrl = novelCoverUrl?.startsWith('http') 
    ? novelCoverUrl
    : novelCoverUrl ? `/novel-covers/${novelCoverUrl}` : null;

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
      <Link
        href={`/novels/${novelId}`}
        className="flex items-center gap-3"
        aria-label="View novel details"
      >
        {/* Cover image - Left side */}
        <div className="relative w-16 h-24 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 hover:opacity-90 transition-opacity flex-shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={novelTitle || 'Novel cover'}
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('Image failed to load:', novelCoverUrl);
                (e.currentTarget as HTMLImageElement).src = 'https://via.placeholder.com/100?text=No+Cover';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
              <Icon icon="mdi:book-variant" className="text-2xl" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/10 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="bg-primary/80 rounded-full p-1.5">
              <Icon icon="mdi:book-open-variant" className="text-white text-sm" />
            </div>
          </div>
        </div>
        
        {/* Title and Button - Right side */}
        <div className="flex-1 min-w-0 flex flex-col justify-between h-24">
          <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2">
            {novelTitle || 'View Novel'}
          </h3>
          <button
            className="self-end mt-auto mb-1 p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            aria-label="View chapters list"
            onClick={(e) => {
              e.preventDefault(); // Prevent Link navigation
              onChaptersClick?.();
            }}
          >
            <Icon icon="mdi:format-list-bulleted" className="text-gray-600 dark:text-gray-400 text-lg" />
          </button>
        </div>
      </Link>
    </div>
  );
};