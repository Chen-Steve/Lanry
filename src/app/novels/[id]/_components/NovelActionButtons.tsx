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
      className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-5 h-10 sm:h-12 rounded-xl bg-green-600 hover:bg-green-700 transition-colors text-white font-medium shadow-lg min-w-[100px] sm:min-w-[120px]"
    >
      <Icon icon="pepicons-print:book-open" className="text-[18px] sm:text-[22px] flex-shrink-0" />
      <span className="text-[13px] sm:text-[15px] whitespace-nowrap leading-none">Read Now</span>
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
    className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl transition-colors touch-manipulation shadow-lg ${
      !isAuthenticated 
        ? 'bg-gray-100 hover:bg-gray-200'
        : isBookmarked 
          ? 'bg-gray-100 hover:bg-gray-200'
          : 'bg-gray-100 hover:bg-gray-200'
    } ${isBookmarkLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <Icon 
      icon={isBookmarked ? "pepicons-print:checkmark" : "pepicons-print:bookmark"} 
      className={`text-[18px] sm:text-[22px] text-black flex-shrink-0 ${isBookmarkLoading ? 'animate-pulse' : ''}`}
    />
  </button>
);

const HomeButton = () => (
  <Link 
    href="/"
    className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors shadow-lg"
  >
    <Icon icon="pepicons-print:house" className="text-[18px] sm:text-[22px] text-black flex-shrink-0" />
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
    <div className="fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 w-fit max-w-[calc(100%-1rem)] sm:max-w-[calc(100%-2rem)] p-1.5 sm:p-2 bg-white/90 backdrop-blur-sm border rounded-xl shadow-lg inline-flex flex-row gap-1.5 sm:gap-2 justify-center items-center">
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