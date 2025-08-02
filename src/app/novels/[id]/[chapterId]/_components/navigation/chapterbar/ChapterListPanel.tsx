'use client';

import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useMemo } from 'react';

interface ChapterListPanelProps {
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
  onClose: () => void;
}

export const ChapterListPanel = ({
  novelId,
  currentChapter,
  currentPartNumber,
  currentVolumeId,
  availableChapters = [],
  volumes = [],
  onClose
}: ChapterListPanelProps) => {
  
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

  const formatChapterTitle = (chapterNumber: number, partNumber?: number | null) => {
    return `Chapter ${chapterNumber}${partNumber ? ` Part ${partNumber}` : ''}`;
  };

  const formatChapterItem = (chapter: typeof availableChapters[0]) => {
    const isLocked = chapter.isAccessible === false;
    const isCurrentChapter = chapter.chapter_number === currentChapter && 
                           chapter.part_number === currentPartNumber && 
                           chapter.volume_id === currentVolumeId;
    
    return (
      <Link
        key={`${chapter.chapter_number}-${chapter.part_number || ''}`}
        href={`/novels/${novelId}/c${chapter.chapter_number}${
          chapter.part_number ? `-p${chapter.part_number}` : ''
        }`}
        onClick={onClose}
        className={`block w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${
          isCurrentChapter
            ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800'
            : ''
        } ${isLocked ? 'text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h4 className={`text-sm font-medium truncate ${
              isCurrentChapter ? 'text-blue-700 dark:text-blue-300' : ''
            }`}>
              {formatChapterTitle(chapter.chapter_number, chapter.part_number)}
            </h4>
          </div>
          <div className="flex items-center gap-2 ml-2">
            {isCurrentChapter && (
              <Icon icon="mdi:play-circle" className="text-blue-600 dark:text-blue-400 text-lg flex-shrink-0" />
            )}
            {isLocked && (
              <Icon icon="mdi:lock" className="text-gray-400 dark:text-gray-500 text-base flex-shrink-0" />
            )}
          </div>
        </div>
      </Link>
    );
  };

  return (
    <>
      {/* Back */}
      <button
        onClick={onClose}
        className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-3"
        aria-label="Back to main options"
      >
        <Icon icon="mdi:chevron-left" className="w-5 h-5" />
        Back
      </button>

      <div 
        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg flex-1 flex flex-col min-h-0"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        {/* Chapter List */}
        <div 
          className="flex-1 overflow-y-auto min-h-0"
          onWheel={(e) => {
            e.stopPropagation();
            // Allow scrolling within this container
            const element = e.currentTarget;
            const { scrollTop, scrollHeight, clientHeight } = element;
            
            // Prevent background scroll when at boundaries
            if ((e.deltaY < 0 && scrollTop === 0) || 
                (e.deltaY > 0 && scrollTop + clientHeight >= scrollHeight)) {
              e.preventDefault();
            }
          }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          {/* Chapters without volume - show these first if they exist */}
          {chaptersGroupedByVolume.noVolumeChapters.length > 0 && (
            <div>
              {chaptersGroupedByVolume.noVolumeChapters
                .sort(sortChapters)
                .map(chapter => formatChapterItem(chapter))}
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
                  <div className="px-4 py-3 text-sm font-semibold bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border-b border-amber-200 dark:border-amber-800">
                    Volume {volume.volume_number}{volume.title ? `: ${volume.title}` : ''}
                  </div>
                  {volumeChapters
                    .sort(sortChapters)
                    .map(chapter => formatChapterItem(chapter))}
                </div>
              );
            })}

          {/* Empty state */}
          {chaptersGroupedByVolume.noVolumeChapters.length === 0 && volumes.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Icon icon="mdi:book-open-blank-variant" className="text-4xl mb-2 mx-auto" />
              <p className="text-sm">No chapters available</p>
            </div>
          )}
        </div>

        {/* Footer with chapter count */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-b-xl flex-shrink-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {availableChapters.length} chapter{availableChapters.length !== 1 ? 's' : ''} total
          </p>
        </div>
      </div>
    </>
  );
};