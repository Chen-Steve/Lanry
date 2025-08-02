import { useEffect, RefObject } from 'react';

interface UseChapterBarEventsProps {
  isMobile: boolean;
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
  setActivePanel: (panel: 'main' | 'text') => void;
  barRef: RefObject<HTMLDivElement>;
  setTouchStartY: (y: number | null) => void;
  setIsTouching: (touching: boolean) => void;
  touchStartY: number | null;
  isTouching: boolean;
  isCommentOpen: boolean;
  floatingDesktopModal?: boolean;
  settingsButtonRef?: RefObject<HTMLButtonElement>;
  setDesktopTop: (top: string | number) => void;
}

export const useChapterBarEvents = ({
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
}: UseChapterBarEventsProps) => {
  // Handle clicks outside the bar (both mobile and desktop)
  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      
      // Check if click is outside the modal/bar
      const isOutsideBar = barRef.current && !barRef.current.contains(target);
      
      // For desktop floating modal, also check if click is on the settings button that opens it
      const isSettingsButton = settingsButtonRef?.current && settingsButtonRef.current.contains(target);
      
      if (isOutsideBar && !isSettingsButton) {
        setIsVisible(false);
        setActivePanel('main');
        // Notify other components that ChapterBar is closed
        const customEvent = new CustomEvent('toggleChapterBar', {
          detail: { isVisible: false },
        });
        document.dispatchEvent(customEvent);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isVisible, barRef, settingsButtonRef, setIsVisible, setActivePanel]);

  // Listen for the custom toggle event
  useEffect(() => {
    const handleToggleChapterBar = (event: CustomEvent) => {
      if (event.detail && typeof event.detail.isVisible === 'boolean') {
        setIsVisible(event.detail.isVisible);
      } else {
        setIsVisible(!isVisible);
      }
    };

    document.addEventListener('toggleChapterBar', handleToggleChapterBar as EventListener);
    return () => document.removeEventListener('toggleChapterBar', handleToggleChapterBar as EventListener);
  }, [isVisible, setIsVisible]);

  // Touch helpers (double-tap toggle)
  useEffect(() => {
    if (!isMobile) return;
    const handleTouchStart = (e: TouchEvent) => {
      setTouchStartY(e.touches[0].clientY);
      setIsTouching(true);
    };
    const handleTouchEnd = () => {
      setTouchStartY(null);
      setIsTouching(false);
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, touchStartY, isTouching, setTouchStartY, setIsTouching]);

  // Auto-close if the comment drawer opens
  useEffect(() => {
    if (isCommentOpen && isVisible) {
      setIsVisible(false);
    }
  }, [isCommentOpen, isVisible, setIsVisible]);

  // Desktop floating modal alignment
  useEffect(() => {
    if (floatingDesktopModal && settingsButtonRef && settingsButtonRef.current && !isMobile) {
      const rect = settingsButtonRef.current.getBoundingClientRect();
      setDesktopTop(rect.top + window.scrollY + 'px');
    }
  }, [floatingDesktopModal, settingsButtonRef, isMobile, isVisible, setDesktopTop]);

  const handleClose = () => {
    setIsVisible(false);
    setActivePanel('main');
    const event = new CustomEvent('toggleChapterBar', { detail: { isVisible: false } });
    document.dispatchEvent(event);
  };

  return {
    handleClose,
  };
};