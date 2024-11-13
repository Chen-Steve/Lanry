'use client';

import { formatDate } from '@/lib/utils';

interface ChapterContentProps {
  chapterNumber: number;
  title: string;
  createdAt: string;
  content: string;
  fontFamily: string;
  fontSize: number;
}

export default function ChapterContent({
  chapterNumber,
  title,
  createdAt,
  content,
  fontFamily,
  fontSize
}: ChapterContentProps) {
  return (
    <div className="mb-6 md:mb-8">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-black">
            Chapter {chapterNumber}: {title}
          </h2>
          <p className="text-xs md:text-sm text-black">
            Published {formatDate(createdAt)}
          </p>
        </div>
      </div>
      
      <div 
        className="prose prose-sm md:prose-base max-w-none text-black"
        style={{ 
          fontFamily: fontFamily,
          fontSize: `${fontSize}px`
        }}
      >
        {content.split('\n').map((paragraph, index) => (
          <p key={index} className="mb-4 leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
} 