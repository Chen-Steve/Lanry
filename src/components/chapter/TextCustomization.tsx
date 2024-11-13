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
  { name: 'Serif', value: 'ui-serif, Georgia, serif' },
  { name: 'Mono', value: 'ui-monospace, monospace' },
];

export default function TextCustomization({
  onFontChange,
  onSizeChange,
  currentFont,
  currentSize,
}: TextCustomizationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100"
        aria-label="Text settings"
      >
        <Icon icon="mdi:cog" className="text-xl text-gray-600 hover:text-gray-900" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border rounded-lg shadow-lg p-4 z-50">
          <div className="mb-4">
            <label className="block text-sm font-medium text-black mb-2">
              Font Family
            </label>
            <div className="space-y-2">
              {fonts.map((font) => (
                <button
                  key={font.name}
                  onClick={() => onFontChange(font.value)}
                  className={`w-full text-left px-3 py-2 rounded-md ${
                    currentFont === font.value
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-black hover:bg-gray-50'
                  }`}
                  style={{ fontFamily: font.value }}
                >
                  {font.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Font Size
            </label>
            <div className="flex items-center gap-4">
              <button
                title="Decrease font size"
                onClick={() => onSizeChange(currentSize - 1)}
                className="p-1 rounded-md hover:bg-gray-100 text-black"
                disabled={currentSize <= 12}
              >
                <Icon icon="mdi:minus" />
              </button>
              <span className="text-sm text-black">{currentSize}px</span>
              <button
                title="Increase font size"
                onClick={() => onSizeChange(currentSize + 1)}
                className="p-1 rounded-md hover:bg-gray-100 text-black"
                disabled={currentSize >= 24}
              >
                <Icon icon="mdi:plus" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 