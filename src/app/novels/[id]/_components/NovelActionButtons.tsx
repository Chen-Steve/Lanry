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
      className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 h-12 sm:h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 transition-colors text-white font-medium shadow-lg min-w-[120px] sm:min-w-[120px]"
    >
      <Icon icon="pepicons-print:book-open" className="text-[22px] sm:text-[22px] flex-shrink-0" />
      <span className="text-[15px] sm:text-[15px] whitespace-nowrap leading-none">Read Now</span>
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
    className={`inline-flex items-center justify-center w-12 h-12 sm:w-12 sm:h-12 rounded-xl transition-colors touch-manipulation shadow-lg ${
      !isAuthenticated 
        ? 'bg-muted hover:bg-accent'
        : isBookmarked 
          ? 'bg-muted hover:bg-accent'
          : 'bg-muted hover:bg-accent'
    } ${isBookmarkLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <Icon 
      icon={isBookmarked ? "pepicons-print:checkmark" : "pepicons-print:bookmark"} 
      className={`text-[22px] sm:text-[22px] text-foreground flex-shrink-0 ${isBookmarkLoading ? 'animate-pulse' : ''}`}
    />
  </button>
);

const HomeButton = () => (
  <Link 
    href="/"
    className="inline-flex items-center justify-center w-12 h-12 sm:w-12 sm:h-12 rounded-xl bg-muted hover:bg-accent transition-colors shadow-lg"
  >
    <Icon icon="pepicons-print:house" className="text-[22px] sm:text-[22px] text-foreground flex-shrink-0" />
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
    <div className="fixed bottom-4 sm:bottom-4 left-1/2 -translate-x-1/2 w-fit max-w-[calc(100%-1.5rem)] sm:max-w-[calc(100%-2rem)] p-2 sm:p-2 bg-background/90 dark:bg-background/80 backdrop-blur-sm border border-border rounded-xl shadow-lg inline-flex flex-row gap-2 sm:gap-2 justify-center items-center">
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