import { useState } from 'react';

export const useChapterBarState = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [isTouching, setIsTouching] = useState(false);
  const [desktopTop, setDesktopTop] = useState<string | number>('4.5rem');
  const [activePanel, setActivePanel] = useState<'main' | 'text' | 'chapters'>('main');

  return {
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
  };
};