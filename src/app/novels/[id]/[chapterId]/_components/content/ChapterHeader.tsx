'use client';

import Link from 'next/link';

interface ChapterHeaderProps {
  novelId: string;
  novelTitle: string;
  author: string;
}

export default function ChapterHeader({
  novelId,
  novelTitle,
}: ChapterHeaderProps) {
  return (
    <div className="mb-2 md:mb-4">
      <div className="max-w-2xl mx-auto text-center">
        <Link 
          href={`/novels/${novelId}`}
          className="inline-block hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          <h1 className="text-xl md:text-2xl font-bold text-black dark:text-white">{novelTitle}</h1>
        </Link>
      </div>
    </div>
  );
} 