'use client';

import { Icon } from '@iconify/react';

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
  { name: 'Comic Sans', value: '"Comic Sans MS", cursive' },
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
  return (
    <div className="flex items-center justify-between">
      {/* Font Family */}
      <div className="flex-1 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-3 min-w-max pr-4">
          {fonts.map((font) => (
            <button
              key={font.name}
              onClick={() => onFontChange(font.value)}
              className={`px-3 py-1 rounded-md text-sm whitespace-nowrap ${
                currentFont === font.value
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={{ fontFamily: font.value }}
            >
              {font.name}
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div className="flex items-center gap-2">
        <button
          title="Decrease Font Size"
          onClick={() => onSizeChange(currentSize - 1)}
          className="p-1 rounded-md hover:bg-gray-100 text-gray-600"
          disabled={currentSize <= 12}
        >
          <Icon icon="mdi:minus" />
        </button>
        <span className="text-sm min-w-[3ch] text-center">{currentSize}</span>
        <button
          title="Increase Font Size"
          onClick={() => onSizeChange(currentSize + 1)}
          className="p-1 rounded-md hover:bg-gray-100 text-gray-600"
          disabled={currentSize >= 24}
        >
          <Icon icon="mdi:plus" />
        </button>
      </div>
    </div>
  );
} 