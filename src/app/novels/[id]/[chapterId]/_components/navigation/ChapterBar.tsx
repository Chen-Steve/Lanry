'use client';

import { useRef } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { NovelInfoCard } from './chapterbar/NovelInfoCard';
import { SettingsPanel } from './chapterbar/SettingsPanel';
import { TextSettingsPanel } from './chapterbar/TextSettingsPanel';
import { ChapterListPanel } from './chapterbar/ChapterListPanel';
import { useChapterBarState } from './hooks/useChapterBarState';
import { useChapterBarEvents } from './hooks/useChapterBarEvents';

interface ChapterProgressBarProps {
  novelId: string;
  onFontChange: (font: string) => void;
  onSizeChange: (size: number) => void;
  currentFont: string;
  currentSize: number;
  isCommentOpen: boolean;
  novelCoverUrl?: string;
  novelTitle?: string;
  hideComments: boolean;
  onHideCommentsChange: (hide: boolean) => void;
  showProfanity: boolean;
  onShowProfanityChange: (show: boolean) => void;
  settingsButtonRef?: React.RefObject<HTMLButtonElement>;
  floatingDesktopModal?: boolean;
  currentChapter?: number;
  currentPartNumber?: number | null;
  currentVolumeId?: string | null;
  availableChapters?: Array<{ 
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
}

export default function ChapterProgressBar({
  novelId,
  onFontChange,
  onSizeChange,
  currentFont,
  currentSize,
  isCommentOpen,
  novelCoverUrl,
  novelTitle,
  hideComments,
  onHideCommentsChange,
  showProfanity,
  onShowProfanityChange,
  settingsButtonRef,
  floatingDesktopModal = false,
  currentChapter,
  currentPartNumber,
  currentVolumeId,
  availableChapters = [],
  volumes = [],
}: ChapterProgressBarProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const barRef = useRef<HTMLDivElement>(null);
  
  const {
    isVisible,
    setIsVisible,
    touchStartY,
    setTouchStartY,
    isTouching,
    setIsTouching,
    desktopTop,
    setDesktopTop,
    activePanel,
    setActivePanel,
  } = useChapterBarState();

  useChapterBarEvents({
    isMobile,
    isVisible,
    setIsVisible,
    setActivePanel,
    barRef,
    setTouchStartY,
    setIsTouching,
    touchStartY,
    isTouching,
    isCommentOpen,
    floatingDesktopModal,
    settingsButtonRef,
    setDesktopTop,
  });



  /* --------------------------------------------------
   *  RENDER (desktop floating modal handled first)
   * ------------------------------------------------*/
  if (floatingDesktopModal && !isMobile) {
    return (
      <div
        ref={barRef}
        className={`fixed right-4 z-[100] transition-all duration-300 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg rounded-lg ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ top: desktopTop }}
      >
        <div className="p-4 relative">


          {/* Panels container */}
          <div className="relative overflow-hidden">
            {/* MAIN PANEL */}
            <div
              className={`space-y-3 transition-transform duration-300 ${activePanel === 'main' ? 'translate-x-0' : '-translate-x-full'}`}
            >
              <NovelInfoCard
                novelId={novelId}
                novelCoverUrl={novelCoverUrl}
                novelTitle={novelTitle}
                onChaptersClick={() => setActivePanel('chapters')}
              />

              <SettingsPanel
                onTextSettingsClick={() => setActivePanel('text')}
                hideComments={hideComments}
                onHideCommentsChange={onHideCommentsChange}
                showProfanity={showProfanity}
                onShowProfanityChange={onShowProfanityChange}
              />
            </div>

            {/* TEXT SETTINGS PANEL */}
            <div
              className={`absolute inset-0 flex flex-col space-y-3 transition-transform duration-300 ${activePanel === 'text' ? 'translate-x-0' : 'translate-x-full'}`}
            >
              <TextSettingsPanel
                onFontChange={onFontChange}
                onSizeChange={onSizeChange}
                currentFont={currentFont}
                currentSize={currentSize}
                onBack={() => setActivePanel('main')}
              />
            </div>

            {/* CHAPTERS PANEL */}
            <div
              className={`absolute inset-0 flex flex-col space-y-3 transition-transform duration-300 ${activePanel === 'chapters' ? 'translate-x-0' : 'translate-x-full'}`}
            >
              <ChapterListPanel
                novelId={novelId}
                currentChapter={currentChapter || 0}
                currentPartNumber={currentPartNumber}
                currentVolumeId={currentVolumeId}
                availableChapters={availableChapters}
                volumes={volumes}
                onClose={() => setActivePanel('main')}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* --------------------------------------
   *  MOBILE (bottom-sheet) implementation
   * -------------------------------------*/
  if (!isMobile) return null;

  return (
    <div
      ref={barRef}
      className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t dark:border-gray-800 shadow-lg transition-all duration-300 rounded-t-2xl ${isVisible ? 'translate-y-0 py-4 min-h-[220px]' : 'translate-y-full'}`}
    >
             <div className="px-4 relative">
         {/* Drag indicator */}
         <span className="block w-12 h-1 mx-auto -mt-1 mb-2 bg-gray-300 dark:bg-gray-700 rounded-full"></span>



         {/* Panels container */}
         <div className="relative overflow-hidden">
           {/* MAIN PANEL */}
           <div
             className={`space-y-3 transition-transform duration-300 ${activePanel === 'main' ? 'translate-x-0' : '-translate-x-full'}`}
           >
             <NovelInfoCard
               novelId={novelId}
               novelCoverUrl={novelCoverUrl}
               novelTitle={novelTitle}
               onChaptersClick={() => setActivePanel('chapters')}
             />

             <SettingsPanel
               onTextSettingsClick={() => setActivePanel('text')}
               hideComments={hideComments}
               onHideCommentsChange={onHideCommentsChange}
               showProfanity={showProfanity}
               onShowProfanityChange={onShowProfanityChange}
             />
           </div>

           {/* TEXT SETTINGS PANEL */}
           <div
             className={`absolute inset-0 flex flex-col space-y-3 transition-transform duration-300 ${activePanel === 'text' ? 'translate-x-0' : 'translate-x-full'}`}
           >
             <TextSettingsPanel
               onFontChange={onFontChange}
               onSizeChange={onSizeChange}
               currentFont={currentFont}
               currentSize={currentSize}
               onBack={() => setActivePanel('main')}
             />
           </div>

           {/* CHAPTERS PANEL */}
           <div
             className={`absolute inset-0 flex flex-col space-y-3 transition-transform duration-300 ${activePanel === 'chapters' ? 'translate-x-0' : 'translate-x-full'}`}
           >
             <ChapterListPanel
               novelId={novelId}
               currentChapter={currentChapter || 0}
               currentPartNumber={currentPartNumber}
               currentVolumeId={currentVolumeId}
               availableChapters={availableChapters}
               volumes={volumes}
               onClose={() => setActivePanel('main')}
             />
           </div>
         </div>
      </div>
    </div>
  );
}