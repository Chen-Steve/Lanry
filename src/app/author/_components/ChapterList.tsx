import React from 'react';
import { Icon } from '@iconify/react';

interface Chapter {
  id: string;
  chapter_number: number;
  title: string;
  content: string;
  novel_id: string;
  slug: string;
  publish_at?: string;
  coins?: number;
  created_at: string;
  updated_at: string;
}

interface ChapterListProps {
  chapters: Chapter[];
  editingChapterId: string | null;
  onChapterClick: (chapter: Chapter) => void;
  onDeleteChapter: (chapterId: string) => void;
}

const isAdvancedChapter = (chapter: Chapter): boolean => {
  const now = new Date();
  const publishDate = chapter.publish_at ? new Date(chapter.publish_at) : null;
  
  return (publishDate !== null && publishDate > now) && 
         (chapter.coins !== undefined && chapter.coins > 0);
};

export default function ChapterList({
  chapters,
  editingChapterId,
  onChapterClick,
  onDeleteChapter
}: ChapterListProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Chapters</h3>
      <div className="space-y-2 h-[calc(100vh-250px)] overflow-y-auto pr-2">
        {chapters.map((chapter) => (
          <div
            key={chapter.id}
            className={`p-4 border rounded relative ${
              editingChapterId === chapter.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
            }`}
          >
            <div 
              onClick={() => onChapterClick(chapter)}
              className="cursor-pointer"
            >
              {isAdvancedChapter(chapter) && (
                <span className="absolute top-2 right-2 text-xs font-semibold px-2 py-1 bg-purple-100 text-purple-700 rounded">
                  Advanced
                </span>
              )}
              <h4 className="font-medium">
                Chapter {chapter.chapter_number}
                {chapter.title && `: ${chapter.title}`}
              </h4>
              {chapter.publish_at && (
                <p className="text-sm text-gray-500">
                  Publishes: {new Date(chapter.publish_at).toLocaleDateString()}
                </p>
              )}
            </div>
            <button
              onClick={() => onDeleteChapter(chapter.id)}
              className="absolute top-2 right-2 p-1 text-gray-500 hover:text-red-500 rounded-full hover:bg-red-50"
              title="Delete chapter"
            >
              <Icon icon="mdi:delete-outline" className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 