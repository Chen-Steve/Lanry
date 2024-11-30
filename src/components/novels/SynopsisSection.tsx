import { Icon } from '@iconify/react';
import Link from 'next/link';
import Image from 'next/image';

interface SynopsisSectionProps {
  title: string;
  description: string;
  chaptersCount: number;
  bookmarkCount: number;
  viewCount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  author: string;
  translator?: { username: string } | null;
  novelSlug: string;
  firstChapterNumber?: number;
  isAuthenticated: boolean;
  isBookmarked: boolean;
  isBookmarkLoading: boolean;
  onBookmarkClick: () => void;
  showActionButtons: boolean;
  coverImageUrl?: string;
}

const formatDateMDY = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric'
  });
};

export const SynopsisSection = ({ 
  title,
  description, 
  chaptersCount, 
  bookmarkCount, 
  viewCount,
  status,
  createdAt,
  updatedAt,
  author,
  translator,
  novelSlug,
  firstChapterNumber,
  isAuthenticated,
  isBookmarked,
  isBookmarkLoading,
  onBookmarkClick,
  showActionButtons,
  coverImageUrl,
}: SynopsisSectionProps) => (
  <div className="flex flex-col md:flex-row gap-8">
    <div className="flex md:flex-col gap-4 md:w-80 flex-shrink-0">
      <div className="w-1/2 md:w-full flex-shrink-0">
        <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden shadow-lg">
          {coverImageUrl ? (
            <Image
              src={`/novel-covers/${coverImageUrl}`}
              alt={title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 320px"
            />
          ) : (
            <div className="w-full h-full bg-gray-300" />
          )}
        </div>
      </div>

      {showActionButtons && (
        <div className="flex flex-col gap-2 justify-start">
          <ActionButtons
            isAuthenticated={isAuthenticated}
            isBookmarked={isBookmarked}
            isBookmarkLoading={isBookmarkLoading}
            onBookmarkClick={onBookmarkClick}
            firstChapterNumber={firstChapterNumber}
            novelSlug={novelSlug}
          />
          
          <div className="flex flex-col md:flex-row flex-wrap gap-4 text-sm mt-2">
            <div className="flex items-center gap-1">
              <Icon icon="pepicons-print:book" className="text-base md:text-lg text-blue-600" />
              <span className="text-black">{chaptersCount} Chapters</span>
            </div>
            <div className="flex items-center gap-1">
              <Icon icon="pepicons-print:bookmark" className="text-black md:text-lg" />
              <span className="text-black">{bookmarkCount} Bookmarks</span>
            </div>
            <div className="flex items-center gap-1">
              <Icon icon="pepicons-print:eye" className="text-base md:text-lg text-purple-600" />
              <span className="text-black">{viewCount} Views</span>
            </div>
          </div>
        </div>
      )}
    </div>

    <div className="text-black flex-1">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-3">{title}</h1>

        <div className="prose max-w-none mb-6">
          <div 
            className="text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-4 text-sm mb-8">
          <div className="flex items-center">
            <span className="text-gray-700 min-w-[5rem]">Author:</span>
            <span className="font-medium">{author}</span>
          </div>
          {translator && (
            <div className="flex items-center">
              <span className="text-gray-700 min-w-[5rem]">Translator:</span>
              <span className="font-medium">{translator.username}</span>
            </div>
          )}
          <div className="flex items-center">
            <span className="text-gray-700 min-w-[5rem]">Status:</span>
            <span className="font-medium">{status}</span>
          </div>
          <div className="flex items-center">
            <span className="text-gray-700 min-w-[5rem]">Released:</span>
            <span className="font-medium">{formatDateMDY(createdAt)}</span>
          </div>
          <div className="flex items-center">
            <span className="text-gray-700 min-w-[5rem]">Updated:</span>
            <span className="font-medium">{formatDateMDY(updatedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ActionButtons = ({
  isAuthenticated,
  isBookmarked,
  isBookmarkLoading,
  onBookmarkClick,
  firstChapterNumber,
  novelSlug,
}: {
  isAuthenticated: boolean;
  isBookmarked: boolean;
  isBookmarkLoading: boolean;
  onBookmarkClick: () => void;
  firstChapterNumber?: number;
  novelSlug: string;
}) => (
  <>
    <button 
      onClick={onBookmarkClick}
      type="button"
      disabled={isBookmarkLoading}
      aria-label={isBookmarked ? "Remove Bookmark" : "Add Bookmark"} 
      className={`flex items-center justify-center gap-1.5 px-3 py-2 md:px-2 md:py-1.5 rounded-lg transition-colors ${
        !isAuthenticated 
          ? 'bg-gray-100 hover:bg-gray-200'
          : isBookmarked 
            ? 'bg-amber-400 hover:bg-amber-500'
            : 'bg-gray-200 hover:bg-gray-300'
      } ${isBookmarkLoading ? 'opacity-50' : ''}`}
    >
      <Icon 
        icon={isBookmarked ? "pepicons-print:bookmark-filled" : "pepicons-print:bookmark"} 
        className={`text-xl md:text-lg text-black ${isBookmarkLoading ? 'animate-pulse' : ''}`}
      />
      <span className="text-base md:text-sm text-black">{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
    </button>
    
    {firstChapterNumber !== undefined && (
      <Link 
        href={`/novels/${novelSlug}/chapters/c${firstChapterNumber}`}
        className="flex items-center justify-center gap-1.5 px-3 py-2 md:px-2 md:py-1.5 rounded-lg bg-green-500 hover:bg-green-600 transition-colors text-white"
      >
        <Icon icon="pepicons-print:book" className="text-xl md:text-lg" />
        <span className="text-base md:text-sm">Start Reading</span>
      </Link>
    )}
  </>
); 