'use client';

import { Icon } from '@iconify/react';
import { useState } from 'react';

interface TextCustomizationProps {
  onFontChange: (font: string) => void;
  onSizeChange: (size: number) => void;
  currentFont: string;
  currentSize: number;
}

const fonts = [
  { name: 'Default', value: 'ui-sans-serif, system-ui, sans-serif', preview: 'Aa' },
  { name: 'Mono', value: 'ui-monospace, monospace', preview: 'Aa' },
  { name: 'Garamond', value: 'Garamond, EB Garamond, serif', preview: 'Aa' },
  { name: 'Comic Sans', value: '"Comic Sans MS", "Comic Sans", "Chalkboard SE", "Comic Neue", sans-serif', preview: 'Aa' },
  { name: 'Playfair Display', value: '"Playfair Display", serif', preview: 'Aa' },
  { name: 'Courier New', value: '"Courier New", monospace', preview: 'Aa' },
];

export default function TextCustomization({
  onFontChange,
  onSizeChange,
  currentFont,
  currentSize,
}: TextCustomizationProps) {
  const [showFontModal, setShowFontModal] = useState(false);
  const isMobile = typeof window !== 'undefined' ? window.innerWidth <= 768 : false;

  const getCurrentFontName = () => {
    const currentFontObj = fonts.find(font => font.value === currentFont);
    return currentFontObj?.name || 'Default';
  };

  return (
    <div className="space-y-6">
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

      {/* Mobile Enhanced Layout */}
      {isMobile && (
        <>
          {/* Font Family Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Font Family</h4>
            <div className="grid grid-cols-3 gap-2">
              {fonts.map((font) => (
                <button
                  key={font.name}
                  onClick={() => onFontChange(font.value)}
                  className={`p-2 rounded-lg border-2 transition-all ${
                    currentFont === font.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span 
                      className="text-lg font-medium"
                      style={{ fontFamily: font.value }}
                    >
                      {font.preview}
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400 text-center leading-tight">
                      {font.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Font Size Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Font Size</h4>
            <div className="flex items-center justify-center gap-3">
              <button
                title="Decrease Font Size"
                onClick={() => onSizeChange(Math.max(12, currentSize - 1))}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                disabled={currentSize <= 12}
              >
                <Icon icon="mdi:minus" className="w-4 h-4" />
              </button>
              <div className="text-center min-w-[4rem]">
                <span className="text-lg font-medium">{currentSize}</span>
              </div>
              <button
                title="Increase Font Size"
                onClick={() => onSizeChange(Math.min(30, currentSize + 1))}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                disabled={currentSize >= 30}
              >
                <Icon icon="mdi:plus" className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 