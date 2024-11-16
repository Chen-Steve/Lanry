'use client';

import { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';

interface ChapterSidebarProps {
  onFontChange: (font: string) => void;
  onSizeChange: (size: number) => void;
  currentFont: string;
  currentSize: number;
}

const fontOptions = [
  { label: 'System Default', value: 'ui-sans-serif, system-ui, sans-serif' },
  { label: 'Serif', value: 'ui-serif, Georgia, Cambria, serif' },
  { label: 'Mono', value: 'ui-monospace, monospace' },
];

// Local storage keys
const FONT_STORAGE_KEY = 'reader-font-family';
const SIZE_STORAGE_KEY = 'reader-font-size';

export default function ChapterSidebar({
  onFontChange,
  onSizeChange,
  currentFont,
  currentSize,
}: ChapterSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load saved settings on mount
  useEffect(() => {
    const savedFont = localStorage.getItem(FONT_STORAGE_KEY);
    const savedSize = localStorage.getItem(SIZE_STORAGE_KEY);

    if (savedFont) onFontChange(savedFont);
    if (savedSize) onSizeChange(Number(savedSize));
  }, [onFontChange, onSizeChange]);

  // Handlers that save to localStorage
  const handleFontChange = (font: string) => {
    localStorage.setItem(FONT_STORAGE_KEY, font);
    onFontChange(font);
  };

  const handleSizeChange = (size: number) => {
    localStorage.setItem(SIZE_STORAGE_KEY, size.toString());
    onSizeChange(size);
  };

  return (
    <div className="hidden md:block fixed right-8 top-1/3 z-50" ref={sidebarRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hover:opacity-80 transition-opacity"
        aria-label="Chapter Settings"
      >
        <Icon icon="pepicons-print:gear" className="text-4xl" />
      </button>

      <div
        className={`absolute right-full mr-4 top-0 w-64 bg-white border rounded-lg shadow-lg p-4 transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : 'translate-x-8 opacity-0 pointer-events-none'
        }`}
      >
        <h3 className="font-semibold mb-4">Reading Settings</h3>
        
        <div className="mb-4">
          <label className="text-sm text-gray-600 mb-2 block">Font Size</label>
          <div className="flex items-center gap-3">
            <button
              aria-label="Decrease Font Size"
              onClick={() => handleSizeChange(currentSize - 1)}
              className="p-2 hover:bg-gray-100 rounded"
              disabled={currentSize <= 12}
            >
              <Icon icon="mdi:minus" />
            </button>
            <span className="text-sm">{currentSize}px</span>
            <button
              aria-label="Increase Font Size"
              onClick={() => handleSizeChange(currentSize + 1)}
              className="p-2 hover:bg-gray-100 rounded"
              disabled={currentSize >= 24}
            >
              <Icon icon="mdi:plus" />
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-600 mb-2 block">Font Family</label>
          <div className="space-y-2">
            {fontOptions.map((font) => (
              <button
                key={font.value}
                onClick={() => handleFontChange(font.value)}
                className={`w-full text-left px-3 py-2 rounded text-sm ${
                  currentFont === font.value
                    ? 'bg-blue-50 text-blue-600'
                    : 'hover:bg-gray-50'
                }`}
              >
                {font.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 