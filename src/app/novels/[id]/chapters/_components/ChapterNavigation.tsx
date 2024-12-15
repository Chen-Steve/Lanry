import Link from 'next/link';
import { Icon } from '@iconify/react';

interface ChapterNavigationProps {
  navigation: {
    prevChapter: { chapter_number: number } | null;
    nextChapter: { chapter_number: number } | null;
  };
  novelId: string;
  currentChapter: number;
  totalChapters: number;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
  handleChapterSelect: (num: number) => void;
  position?: 'top' | 'bottom';
}

export default function ChapterNavigation({ 
  navigation, 
  novelId, 
  currentChapter, 
  totalChapters, 
  isDropdownOpen, 
  setIsDropdownOpen, 
  handleChapterSelect,
  position = 'bottom'
}: ChapterNavigationProps) {
  const dropdownPosition = position === 'top' 
    ? 'top-full left-1/2 -translate-x-1/2 mt-2' 
    : 'bottom-full left-1/2 -translate-x-1/2 mb-2';

  return (
    <div className="flex items-center justify-center gap-2">
      {/* Previous Chapter */}
      <div className="w-auto">
        {navigation.prevChapter ? (
          <Link
            href={`/novels/${novelId}/chapters/c${navigation.prevChapter.chapter_number}`}
            className="inline-flex items-center px-3 py-2 bg-[#F7F4ED] hover:bg-[#F2EEE5] rounded-lg text-black transition-colors text-sm whitespace-nowrap border border-gray-300"
          >
            <div className="flex items-center gap-1">
              <Icon icon="mdi:chevron-left" className="text-lg" />
              <span>Ch.{navigation.prevChapter.chapter_number}</span>
            </div>
          </Link>
        ) : (
          <div className="px-3 py-2 text-gray-400 text-sm border border-gray-200 rounded-lg">Ch.1</div>
        )}
      </div>

      {/* Chapter Selector */}
      <div className="relative w-[160px]">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg flex items-center justify-center gap-1 bg-[#F7F4ED] hover:bg-[#F2EEE5] transition-colors text-black text-sm"
        >
          <span>Chapter {currentChapter}</span>
          <Icon icon="mdi:chevron-down" className="text-lg" />
        </button>

        {isDropdownOpen && (
          <div className={`absolute ${dropdownPosition} w-44 max-h-[60vh] overflow-y-auto bg-[#F7F4ED] border rounded-lg shadow-lg z-50 left-1/2 -translate-x-1/2`}>
            {Array.from({ length: totalChapters }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => handleChapterSelect(num)}
                className={`w-full px-3 py-2 text-left hover:bg-[#F2EEE5] transition-colors text-black text-sm ${
                  num === currentChapter ? 'bg-[#F2EEE5]' : ''
                }`}
              >
                Chapter {num}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Next Chapter */}
      <div className="w-auto">
        {navigation.nextChapter ? (
          <Link
            href={`/novels/${novelId}/chapters/c${navigation.nextChapter.chapter_number}`}
            className="inline-flex items-center px-3 py-2 bg-[#F7F4ED] hover:bg-[#F2EEE5] rounded-lg text-black transition-colors text-sm whitespace-nowrap border border-gray-300"
          >
            <div className="flex items-center gap-1">
              <span>Ch.{navigation.nextChapter.chapter_number}</span>
              <Icon icon="mdi:chevron-right" className="text-lg" />
            </div>
          </Link>
        ) : (
          <div className="px-3 py-2 text-gray-400 text-sm text-right border border-gray-200 rounded-lg">Ch.{totalChapters}</div>
        )}
      </div>
    </div>
  );
} 