import { Icon } from '@iconify/react';
import Link from 'next/link';

interface NovelActionButtonsProps {
  firstChapterNumber?: number;
  novelSlug: string;
  isAuthenticated: boolean;
  isBookmarked: boolean;
  isBookmarkLoading: boolean;
  onBookmarkClick: () => void;
}

const ReadButton = ({ firstChapterNumber, novelSlug }: { firstChapterNumber?: number; novelSlug: string }) => {
  if (firstChapterNumber === undefined) return null;
  
  return (
    <Link 
      href={`/novels/${novelSlug}/c${firstChapterNumber}`}
      className="flex items-center justify-center gap-1 px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 transition-colors text-white font-medium shadow-lg min-w-[120px]"
    >
      <span className="text-base">Read Now</span>
    </Link>
  );
};

const BookmarkButton = ({
  isAuthenticated,
  isBookmarked,
  isBookmarkLoading,
  onBookmarkClick,
}: {
  isAuthenticated: boolean;
  isBookmarked: boolean;
  isBookmarkLoading: boolean;
  onBookmarkClick: () => void;
}) => (
  <button 
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isBookmarkLoading) {
        onBookmarkClick();
      }
    }}
    type="button"
    disabled={isBookmarkLoading}
    aria-label={isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
    className={`flex items-center justify-center w-12 h-12 rounded-xl transition-colors touch-manipulation shadow-lg ${
      !isAuthenticated 
        ? 'bg-gray-100 hover:bg-gray-200'
        : isBookmarked 
          ? 'bg-gray-100 hover:bg-gray-200'
          : 'bg-gray-100 hover:bg-gray-200'
    } ${isBookmarkLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <Icon 
      icon={isBookmarked ? "pepicons-print:checkmark" : "pepicons-print:bookmark"} 
      className={`text-2xl text-black ${isBookmarkLoading ? 'animate-pulse' : ''}`}
    />
  </button>
);

const HomeButton = () => (
  <Link 
    href="/"
    className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors shadow-lg"
  >
    <Icon icon="pepicons-print:house" className="text-2xl text-black" />
  </Link>
);

export const NovelActionButtons = ({
  firstChapterNumber,
  novelSlug,
  isAuthenticated,
  isBookmarked,
  isBookmarkLoading,
  onBookmarkClick,
}: NovelActionButtonsProps) => {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-fit max-w-[calc(100%-2rem)] py-2 px-3 bg-white/90 backdrop-blur-sm border rounded-xl shadow-lg flex flex-row gap-2 justify-center items-center">
      <HomeButton />
      <ReadButton
        firstChapterNumber={firstChapterNumber}
        novelSlug={novelSlug}
      />
      <BookmarkButton
        isAuthenticated={isAuthenticated}
        isBookmarked={isBookmarked}
        isBookmarkLoading={isBookmarkLoading}
        onBookmarkClick={onBookmarkClick}
      />
    </div>
  );
}; 