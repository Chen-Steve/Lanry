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
    <div className="mb-6 md:mb-8">
      <div className="text-center">
        <Link 
          href={`/novels/${novelId}`}
          className="inline-block hover:text-gray-700"
        >
          <h1 className="text-xl md:text-2xl font-bold text-black">{novelTitle}</h1>
        </Link>
      </div>
    </div>
  );
} 