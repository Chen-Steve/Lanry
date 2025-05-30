import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useMemo, useState, useEffect, useRef } from 'react';

interface ChapterNavigationProps {
  navigation: {
    prevChapter: { 
      chapter_number: number; 
      part_number?: number | null; 
      volume_id?: string;
      isAccessible?: boolean;
    } | null;
    nextChapter: { 
      chapter_number: number; 
      part_number?: number | null; 
      volume_id?: string;
      isAccessible?: boolean;
    } | null;
  };
  novelId: string;
  currentChapter: number;
  currentPartNumber?: number | null;
  currentVolumeId?: string | null;
  availableChapters: Array<{ 
    chapter_number: number; 
    part_number?: number | null;
    volume_id?: string;
    isAccessible?: boolean;
  }>;
  volumes?: Array<{
    id: string;
    title: string;
    volume_number: number;
  }>;
  handleChapterSelect: (chapterNumber: number, partNumber?: number | null, volumeId?: string | null) => void;
  position?: 'top' | 'bottom';
}

export default function ChapterNavigation({ 
  navigation, 
  novelId, 
  currentChapter,
  currentPartNumber,
  currentVolumeId,
  availableChapters = [],
  volumes = [],
  handleChapterSelect,
  position = 'bottom'
}: ChapterNavigationProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const dropdownPosition = position === 'top' 
    ? 'top-full left-1/2 -translate-x-1/2 mt-2' 
    : 'bottom-full left-1/2 -translate-x-1/2 mb-2';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDropdownTitle = (chapterNumber: number, partNumber?: number | null) => {
    return `Chapter ${chapterNumber}${partNumber ? ` Part ${partNumber}` : ''}`;
  };

  const formatChapterTitle = (chapterNumber: number, partNumber?: number | null) => {
    return `Ch. ${chapterNumber}${partNumber ? `.${partNumber}` : ''}`;
  };

  // Custom sort function for chapters
  const sortChapters = (a: { chapter_number: number; part_number?: number | null }, b: { chapter_number: number; part_number?: number | null }) => {
    if (a.chapter_number !== b.chapter_number) {
      return a.chapter_number - b.chapter_number;
    }
    // If chapter numbers are equal, sort by part number
    const aPart = a.part_number ?? 0;
    const bPart = b.part_number ?? 0;
    return aPart - bPart;
  };

  // Group chapters by volume
  const chaptersGroupedByVolume = useMemo(() => {
    // Include all chapters, not just accessible ones
    const noVolumeChapters = availableChapters.filter(chapter => !chapter.volume_id);
    const volumeChapters = new Map<string, typeof availableChapters>();
    
    volumes.forEach(volume => {
      const chaptersForVolume = availableChapters.filter(chapter => chapter.volume_id === volume.id);
      if (chaptersForVolume.length > 0) {
        volumeChapters.set(volume.id, chaptersForVolume);
      }
    });

    return {
      noVolumeChapters,
      volumeChapters
    };
  }, [availableChapters, volumes]);

  const formatChapterButton = (chapter: typeof availableChapters[0]) => {
    const isLocked = chapter.isAccessible === false;
    return (
      <button
        key={`${chapter.chapter_number}-${chapter.part_number || ''}`}
        onClick={() => {
          handleChapterSelect(chapter.chapter_number, chapter.part_number, chapter.volume_id);
          setIsDropdownOpen(false);
        }}
        className={`w-full px-3 py-2 text-left hover:bg-accent transition-colors text-xs sm:text-sm flex items-center justify-between ${
          chapter.chapter_number === currentChapter && 
          chapter.part_number === currentPartNumber && 
          chapter.volume_id === currentVolumeId
            ? 'bg-accent'
            : ''
        } ${isLocked ? 'text-muted-foreground' : 'text-foreground'}`}
      >
        <span>{formatDropdownTitle(chapter.chapter_number, chapter.part_number)}</span>
        {isLocked && <Icon icon="mdi:lock" className="text-base flex-shrink-0" />}
      </button>
    );
  };

  return (
    <div className="flex items-center justify-center w-full max-w-screen-lg mx-auto px-2">
      <div className="inline-flex items-center gap-2 h-10">
        {/* Previous Chapter */}
        <div className="w-[80px] sm:w-[90px] h-full">
          {navigation.prevChapter ? (
            <Link
              href={`/novels/${novelId}/c${navigation.prevChapter.chapter_number}${
                navigation.prevChapter.part_number ? `-p${navigation.prevChapter.part_number}` : ''
              }`}
              className={`inline-flex items-center justify-center w-full h-full px-1.5 sm:px-2 bg-background hover:bg-accent rounded-lg transition-colors text-xs sm:text-sm whitespace-nowrap border border-border ${
                navigation.prevChapter.isAccessible === false ? 'text-muted-foreground' : 'text-foreground'
              }`}
            >
              <div className="flex items-center gap-0.5 sm:gap-1">
                <Icon icon="mdi:chevron-left" className="text-base sm:text-lg" />
                <span>{formatChapterTitle(navigation.prevChapter.chapter_number, navigation.prevChapter.part_number)}</span>
                {navigation.prevChapter.isAccessible === false && (
                  <Icon icon="mdi:lock" className="text-base flex-shrink-0" />
                )}
              </div>
            </Link>
          ) : (
            <div className="flex items-center justify-center w-full h-full px-1.5 sm:px-2 py-2 text-muted-foreground text-xs sm:text-sm border border-border rounded-lg opacity-50">
              <span>First Ch.</span>
            </div>
          )}
        </div>

        {/* Chapter Selector */}
        <div className="relative w-[140px] sm:w-[180px] h-full" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full h-full px-1.5 sm:px-2 border border-border rounded-lg flex items-center justify-center gap-1 bg-background hover:bg-accent transition-colors text-foreground text-xs sm:text-sm"
          >
            <span className="truncate">{formatDropdownTitle(currentChapter, currentPartNumber)}</span>
            <Icon icon="mdi:chevron-down" className="text-base sm:text-lg flex-shrink-0" />
          </button>

          {isDropdownOpen && (
            <div className={`absolute ${dropdownPosition} w-full max-h-[60vh] overflow-y-auto bg-background border-border border rounded-lg shadow-lg z-50`}>
              {/* Chapters without volume - show these first if they exist */}
              {chaptersGroupedByVolume.noVolumeChapters.length > 0 && (
                <div className="border-b border-border">
                  {chaptersGroupedByVolume.noVolumeChapters
                    .sort(sortChapters)
                    .map(chapter => formatChapterButton(chapter))}
                </div>
              )}

              {/* Volumes */}
              {volumes
                .sort((a, b) => a.volume_number - b.volume_number)
                .map((volume) => {
                  const volumeChapters = chaptersGroupedByVolume.volumeChapters.get(volume.id) || [];
                  if (volumeChapters.length === 0) return null;

                  return (
                    <div key={volume.id}>
                      <div className="px-3 py-2 text-xs sm:text-sm font-medium bg-yellow-100 dark:bg-yellow-900/50">
                        Volume {volume.volume_number}{volume.title ? `: ${volume.title}` : ''}
                      </div>
                      {volumeChapters
                        .sort(sortChapters)
                        .map(chapter => formatChapterButton(chapter))}
                    </div>
                  );
                })}

              {chaptersGroupedByVolume.noVolumeChapters.length === 0 && volumes.length === 0 && (
                <div className="px-3 py-2 text-muted-foreground text-xs sm:text-sm text-center">
                  No chapters available
                </div>
              )}
            </div>
          )}
        </div>

        {/* Next Chapter */}
        <div className="w-[80px] sm:w-[90px] h-full">
          {navigation.nextChapter ? (
            <Link
              href={`/novels/${novelId}/c${navigation.nextChapter.chapter_number}${
                navigation.nextChapter.part_number ? `-p${navigation.nextChapter.part_number}` : ''
              }`}
              className={`inline-flex items-center justify-center w-full h-full px-1.5 sm:px-2 bg-background hover:bg-accent rounded-lg transition-colors text-xs sm:text-sm whitespace-nowrap border border-border ${
                navigation.nextChapter.isAccessible === false ? 'text-muted-foreground' : 'text-foreground'
              }`}
            >
              <div className="flex items-center gap-0.5 sm:gap-1">
                <span>{formatChapterTitle(navigation.nextChapter.chapter_number, navigation.nextChapter.part_number)}</span>
                {navigation.nextChapter.isAccessible === false && (
                  <Icon icon="mdi:lock" className="text-base flex-shrink-0" />
                )}
                <Icon icon="mdi:chevron-right" className="text-base sm:text-lg" />
              </div>
            </Link>
          ) : (
            <div className="flex items-center justify-center w-full h-full px-1.5 sm:px-2 py-2 text-muted-foreground text-xs sm:text-sm border border-border rounded-lg opacity-50">
              <span>Last Ch.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}