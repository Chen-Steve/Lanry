'use client';

import { Icon } from '@iconify/react';
import { useState, useRef, useEffect } from 'react';

interface TextCustomizationProps {
  onFontChange: (font: string) => void;
  onSizeChange: (size: number) => void;
  currentFont: string;
  currentSize: number;
}

const fonts = [
  { name: 'Default', value: 'ui-sans-serif, system-ui, sans-serif' },
  { name: 'Mono', value: 'ui-monospace, monospace' },
  { name: 'Garamond', value: 'Garamond, EB Garamond, serif' },
  { name: 'Comic Sans', value: '"Comic Sans MS", "Comic Sans", "Chalkboard SE", "Comic Neue", sans-serif' },
  { name: 'Playfair Display', value: '"Playfair Display", serif' },
  { name: 'Montserrat', value: 'Montserrat, sans-serif' },
  { name: 'Courier New', value: '"Courier New", monospace' },
];

export default function TextCustomization({
  onFontChange,
  onSizeChange,
  currentFont,
  currentSize,
}: TextCustomizationProps) {
  const [showFontModal, setShowFontModal] = useState(false);
  const [canScroll, setCanScroll] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = typeof window !== 'undefined' ? window.innerWidth <= 768 : false;

  // Check if scrolling is possible
  useEffect(() => {
    if (!isMobile || !scrollContainerRef.current) return;

    const checkScroll = () => {
      const container = scrollContainerRef.current;
      if (container) {
        setCanScroll(container.scrollWidth > container.clientWidth);
      }
    };

    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [isMobile]);

  const getCurrentFontName = () => {
    const currentFontObj = fonts.find(font => font.value === currentFont);
    return currentFontObj?.name || 'Default';
  };

  return (
    <div className="space-y-4">
      {/* Desktop Controls */}
      {!isMobile && (
        <>
          <div className="flex items-center gap-4">
            {/* Font Selection Button */}
            <button
              onClick={() => setShowFontModal(!showFontModal)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
            >
              <Icon icon="mdi:format-font" className="text-lg" />
              <span style={{ fontFamily: currentFont }}>{getCurrentFontName()}</span>
              <Icon icon="mdi:chevron-down" className={`text-lg transition-transform ${showFontModal ? 'rotate-180' : ''}`} />
            </button>

            {/* Font Size Controls */}
            <div className="flex items-center gap-2 border-l border-gray-200 dark:border-gray-700 pl-4">
              <button
                title="Decrease Font Size"
                onClick={() => onSizeChange(currentSize - 1)}
                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                disabled={currentSize <= 12}
              >
                <Icon icon="mdi:minus" />
              </button>
              <span className="text-sm min-w-[3ch] text-center">{currentSize}</span>
              <button
                title="Increase Font Size"
                onClick={() => onSizeChange(currentSize + 1)}
                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                disabled={currentSize >= 24}
              >
                <Icon icon="mdi:plus" />
              </button>
            </div>
          </div>

          {/* Font Modal */}
          {showFontModal && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 space-y-1">
              {fonts.map((font) => (
                <button
                  key={font.name}
                  onClick={() => {
                    onFontChange(font.value);
                    setShowFontModal(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm whitespace-nowrap transition-colors ${
                    currentFont === font.value
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  style={{ fontFamily: font.value }}
                >
                  {font.name}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Mobile Font Selection */}
      {isMobile && (
        <>
          <div className="relative">
            <div 
              ref={scrollContainerRef}
              className="flex-1 overflow-x-auto no-scrollbar"
            >
              <div className="flex items-center gap-3 min-w-max pr-4">
                {fonts.map((font) => (
                  <button
                    key={font.name}
                    onClick={() => onFontChange(font.value)}
                    className={`px-3 py-1 rounded-md text-sm whitespace-nowrap ${
                      currentFont === font.value
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    style={{ fontFamily: font.value }}
                  >
                    {font.name}
                  </button>
                ))}
              </div>
            </div>
            {/* Scroll Indicator */}
            {canScroll && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100/80 dark:bg-gray-800/80 shadow-sm">
                  <Icon 
                    icon="mdi:chevron-right" 
                    className="w-5 h-5 text-gray-500 dark:text-gray-400 animate-pulse" 
                  />
                </div>
              </div>
            )}
          </div>

          {/* Mobile Font Size Controls */}
          <div className="flex items-center justify-end gap-2">
            <button
              title="Decrease Font Size"
              onClick={() => onSizeChange(currentSize - 1)}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
              disabled={currentSize <= 12}
            >
              <Icon icon="mdi:minus" />
            </button>
            <span className="text-sm min-w-[3ch] text-center">{currentSize}</span>
            <button
              title="Increase Font Size"
              onClick={() => onSizeChange(currentSize + 1)}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
              disabled={currentSize >= 24}
            >
              <Icon icon="mdi:plus" />
            </button>
          </div>
        </>
      )}
    </div>
  );
} 