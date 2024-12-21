import Link from 'next/link';
import { Icon } from '@iconify/react';

interface ChapterNavigationProps {
  navigation: {
    prevChapter: { chapter_number: number; part_number?: number | null } | null;
    nextChapter: { chapter_number: number; part_number?: number | null } | null;
  };
  novelId: string;
  currentChapter: number;
  currentPartNumber?: number | null;
  availableChapters: Array<{ chapter_number: number; part_number?: number | null }>;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
  handleChapterSelect: (chapterNumber: number, partNumber?: number | null) => void;
  position?: 'top' | 'bottom';
}

export default function ChapterNavigation({ 
  navigation, 
  novelId, 
  currentChapter,
  currentPartNumber,
  availableChapters = [],
  isDropdownOpen, 
  setIsDropdownOpen, 
  handleChapterSelect,
  position = 'bottom'
}: ChapterNavigationProps) {
  const dropdownPosition = position === 'top' 
    ? 'top-full left-1/2 -translate-x-1/2 mt-2' 
    : 'bottom-full left-1/2 -translate-x-1/2 mb-2';

  const formatChapterTitle = (chapterNumber: number, partNumber?: number | null) => {
    return `Ch. ${chapterNumber}${partNumber ? ` Part ${partNumber}` : ''}`;
  };

  const formatDropdownTitle = (chapterNumber: number, partNumber?: number | null) => {
    return `Chapter ${chapterNumber}${partNumber ? ` Part ${partNumber}` : ''}`;
  };

  return (
    <div className="flex items-center justify-center gap-2">
      {/* Previous Chapter */}
      <div className="w-auto">
        {navigation.prevChapter ? (
          <Link
            href={`/novels/${novelId}/c${navigation.prevChapter.chapter_number}${
              navigation.prevChapter.part_number ? `-p${navigation.prevChapter.part_number}` : ''
            }`}
            className="inline-flex items-center px-3 py-2 bg-[#F7F4ED] hover:bg-[#F2EEE5] rounded-lg text-black transition-colors text-sm whitespace-nowrap border border-gray-300"
          >
            <div className="flex items-center gap-1">
              <Icon icon="mdi:chevron-left" className="text-lg" />
              <span>{formatChapterTitle(navigation.prevChapter.chapter_number, navigation.prevChapter.part_number)}</span>
            </div>
          </Link>
        ) : (
          <div className="px-3 py-2 text-gray-400 text-sm border border-gray-200 rounded-lg">
            {formatChapterTitle(availableChapters[0]?.chapter_number || 1, availableChapters[0]?.part_number)}
          </div>
        )}
      </div>

      {/* Chapter Selector */}
      <div className="relative w-[160px]">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg flex items-center justify-center gap-1 bg-[#F7F4ED] hover:bg-[#F2EEE5] transition-colors text-black text-sm"
        >
          <span>{formatDropdownTitle(currentChapter, currentPartNumber)}</span>
          <Icon icon="mdi:chevron-down" className="text-lg" />
        </button>

        {isDropdownOpen && (
          <div className={`absolute ${dropdownPosition} w-full max-h-[60vh] overflow-y-auto bg-[#F7F4ED] border rounded-lg shadow-lg z-50`}>
            {availableChapters.length > 0 ? (
              availableChapters.map((chapter) => (
                <button
                  key={`${chapter.chapter_number}-${chapter.part_number || ''}`}
                  onClick={() => handleChapterSelect(chapter.chapter_number, chapter.part_number)}
                  className={`w-full px-3 py-2 text-left hover:bg-[#F2EEE5] transition-colors text-black text-sm ${
                    chapter.chapter_number === currentChapter && chapter.part_number === currentPartNumber ? 'bg-[#F2EEE5]' : ''
                  }`}
                >
                  {formatDropdownTitle(chapter.chapter_number, chapter.part_number)}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-500 text-sm text-center">
                No chapters available
              </div>
            )}
          </div>
        )}
      </div>

      {/* Next Chapter */}
      <div className="w-auto">
        {navigation.nextChapter ? (
          <Link
            href={`/novels/${novelId}/c${navigation.nextChapter.chapter_number}${
              navigation.nextChapter.part_number ? `-p${navigation.nextChapter.part_number}` : ''
            }`}
            className="inline-flex items-center px-3 py-2 bg-[#F7F4ED] hover:bg-[#F2EEE5] rounded-lg text-black transition-colors text-sm whitespace-nowrap border border-gray-300"
          >
            <div className="flex items-center gap-1">
              <span>{formatChapterTitle(navigation.nextChapter.chapter_number, navigation.nextChapter.part_number)}</span>
              <Icon icon="mdi:chevron-right" className="text-lg" />
            </div>
          </Link>
        ) : (
          <div className="px-3 py-2 text-gray-400 text-sm text-right border border-gray-200 rounded-lg">
            {formatChapterTitle(
              availableChapters[availableChapters.length - 1]?.chapter_number || 1,
              availableChapters[availableChapters.length - 1]?.part_number
            )}
          </div>
        )}
      </div>
    </div>
  );
} 