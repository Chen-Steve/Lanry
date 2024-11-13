'use client';

import Link from 'next/link';
import { Icon } from '@iconify/react';
import TextCustomization from '@/components/chapter/TextCustomization';

interface ChapterHeaderProps {
  novelId: string;
  novelTitle: string;
  author: string;
  fontFamily: string;
  fontSize: number;
  onFontChange: (font: string) => void;
  onSizeChange: (size: number) => void;
}

export default function ChapterHeader({
  novelId,
  novelTitle,
  author,
  fontFamily,
  fontSize,
  onFontChange,
  onSizeChange
}: ChapterHeaderProps) {
  return (
    <div className="mb-6 md:mb-8">
      <Link 
        href={`/novels/${novelId}`}
        className="text-black hover:text-gray-700 flex items-center gap-1 text-sm md:text-base"
      >
        <Icon icon="mdi:arrow-left" />
        <span>Back to Novel</span>
      </Link>
      <div className="flex justify-between items-center mt-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-black">{novelTitle}</h1>
          <p className="text-sm md:text-base text-black">by {author}</p>
        </div>
        <TextCustomization
          currentFont={fontFamily}
          currentSize={fontSize}
          onFontChange={onFontChange}
          onSizeChange={onSizeChange}
        />
      </div>
    </div>
  );
} 