import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useMemo } from 'react';

interface ChapterNavigationProps {
  navigation: {
    prevChapter: { chapter_number: number; part_number?: number | null; volume_id?: string } | null;
    nextChapter: { chapter_number: number; part_number?: number | null; volume_id?: string } | null;
  };
  novelId: string;
  currentChapter: number;
  currentPartNumber?: number | null;
  currentVolumeId?: string | null;
  availableChapters: Array<{ 
    chapter_number: number; 
    part_number?: number | null;
    volume_id?: string;
  }>;
  volumes?: Array<{
    id: string;
    title: string;
    volume_number: number;
  }>;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
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

  // Group chapters by volume
  const chaptersGroupedByVolume = useMemo(() => {
    console.log('Volumes array length:', volumes.length);
    console.log('Volumes array content:', JSON.stringify(volumes, null, 2));
    console.log('Available chapters:', availableChapters);
    
    const noVolumeChapters = availableChapters.filter(chapter => !chapter.volume_id);
    
    const volumeChapters = new Map<string, typeof availableChapters>();
    
    volumes.forEach(volume => {
      const chaptersForVolume = availableChapters.filter(chapter => chapter.volume_id === volume.id);
      console.log(`Chapters for Volume ${volume.volume_number}:`, chaptersForVolume);
      volumeChapters.set(volume.id, chaptersForVolume);
    });

    return {
      noVolumeChapters,
      volumeChapters
    };
  }, [availableChapters, volumes]);

  console.log('Grouped Chapters:', chaptersGroupedByVolume);
  console.log('Rendering with volumes:', volumes);

  return (
    <div className="flex items-center justify-center gap-2">
      {/* Previous Chapter */}
      <div className="w-auto">
        {navigation.prevChapter ? (
          <Link
            href={`/novels/${novelId}/c${navigation.prevChapter.chapter_number}${
              navigation.prevChapter.part_number ? `-p${navigation.prevChapter.part_number}` : ''
            }`}
            className="inline-flex items-center px-3 py-2 bg-background hover:bg-accent rounded-lg text-foreground transition-colors text-sm whitespace-nowrap border border-border"
          >
            <div className="flex items-center gap-1">
              <Icon icon="mdi:chevron-left" className="text-lg" />
              <span>{formatChapterTitle(navigation.prevChapter.chapter_number, navigation.prevChapter.part_number)}</span>
            </div>
          </Link>
        ) : (
          <div className="px-3 py-2 text-muted-foreground text-sm border border-border rounded-lg">
            {formatChapterTitle(availableChapters[0]?.chapter_number || 1, availableChapters[0]?.part_number)}
          </div>
        )}
      </div>

      {/* Chapter Selector */}
      <div className="relative w-[160px]">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full px-3 py-2 border border-border rounded-lg flex items-center justify-center gap-1 bg-background hover:bg-accent transition-colors text-foreground text-sm"
        >
          <span>{formatDropdownTitle(currentChapter, currentPartNumber)}</span>
          <Icon icon="mdi:chevron-down" className="text-lg" />
        </button>

        {isDropdownOpen && (
          <div className={`absolute ${dropdownPosition} w-full max-h-[60vh] overflow-y-auto bg-background border-border border rounded-lg shadow-lg z-50`}>
            {/* Volumes */}
            {volumes
              .sort((a, b) => a.volume_number - b.volume_number)
              .map((volume) => {
                const volumeChapters = chaptersGroupedByVolume.volumeChapters.get(volume.id) || [];
                if (volumeChapters.length === 0) return null;

                return (
                  <div key={volume.id}>
                    <div className="px-3 py-2 text-sm font-medium bg-yellow-100 dark:bg-yellow-900/50">
                      Volume {volume.volume_number}{volume.title ? `: ${volume.title}` : ''}
                    </div>
                    {volumeChapters
                      .sort((a, b) => a.chapter_number - b.chapter_number)
                      .map((chapter) => (
                        <button
                          key={`${chapter.chapter_number}-${chapter.part_number || ''}`}
                          onClick={() => handleChapterSelect(chapter.chapter_number, chapter.part_number, chapter.volume_id)}
                          className={`w-full px-3 py-2 text-left hover:bg-accent transition-colors text-foreground text-sm ${
                            chapter.chapter_number === currentChapter && 
                            chapter.part_number === currentPartNumber && 
                            chapter.volume_id === currentVolumeId
                              ? 'bg-accent'
                              : ''
                          }`}
                        >
                          {formatDropdownTitle(chapter.chapter_number, chapter.part_number)}
                        </button>
                      ))}
                  </div>
                );
              })}

            {/* Chapters without volume */}
            {chaptersGroupedByVolume.noVolumeChapters.length > 0 && (
              <>
                {chaptersGroupedByVolume.noVolumeChapters
                  .sort((a, b) => a.chapter_number - b.chapter_number)
                  .map((chapter) => (
                    <button
                      key={`${chapter.chapter_number}-${chapter.part_number || ''}`}
                      onClick={() => handleChapterSelect(chapter.chapter_number, chapter.part_number, chapter.volume_id)}
                      className={`w-full px-3 py-2 text-left hover:bg-accent transition-colors text-foreground text-sm ${
                        chapter.chapter_number === currentChapter && 
                        chapter.part_number === currentPartNumber && 
                        !currentVolumeId
                          ? 'bg-accent'
                          : ''
                      }`}
                    >
                      {formatDropdownTitle(chapter.chapter_number, chapter.part_number)}
                    </button>
                  ))}
              </>
            )}

            {chaptersGroupedByVolume.noVolumeChapters.length === 0 && volumes.length === 0 && (
              <div className="px-3 py-2 text-muted-foreground text-sm text-center">
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
            className="inline-flex items-center px-3 py-2 bg-background hover:bg-accent rounded-lg text-foreground transition-colors text-sm whitespace-nowrap border border-border"
          >
            <div className="flex items-center gap-1">
              <span>{formatChapterTitle(navigation.nextChapter.chapter_number, navigation.nextChapter.part_number)}</span>
              <Icon icon="mdi:chevron-right" className="text-lg" />
            </div>
          </Link>
        ) : (
          <div className="px-3 py-2 text-muted-foreground text-sm text-right border border-border rounded-lg">
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