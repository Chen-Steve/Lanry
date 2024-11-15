'use client';

import Link from 'next/link';
import { Icon } from '@iconify/react';

interface ChapterHeaderProps {
  novelId: string;
  novelTitle: string;
  author: string;
}

export default function ChapterHeader({
  novelId,
  novelTitle,
  author,
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
      <div className="mt-3">
        <h1 className="text-xl md:text-2xl font-bold text-black">{novelTitle}</h1>
        <p className="text-sm md:text-base text-black">by {author}</p>
      </div>
    </div>
  );
} 