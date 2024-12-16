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
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-2 sm:p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Chapters
          </h3>
          <span className="text-sm text-gray-500">
            {chapters.length} {chapters.length === 1 ? 'chapter' : 'chapters'}
          </span>
        </div>
      </div>

      <div className="divide-y h-[calc(100vh-280px)] overflow-y-auto">
        {chapters.length === 0 ? (
          <div className="p-4 sm:p-6 text-center text-gray-500">
            <Icon icon="mdi:book-open-outline" className="w-8 h-8 mx-auto mb-2 opacity-75" />
            <p>No chapters yet</p>
          </div>
        ) : (
          chapters.map((chapter) => (
            <div
              key={chapter.id}
              className={`relative group ${
                editingChapterId === chapter.id 
                  ? 'bg-blue-50 hover:bg-blue-100' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <div 
                onClick={() => onChapterClick(chapter)}
                className="p-3 sm:p-5 cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 pr-10">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      Chapter {chapter.chapter_number}
                      {chapter.title && (
                        <span className="text-gray-700 ml-1">: {chapter.title}</span>
                      )}
                    </h4>
                    {chapter.publish_at && (
                      <p className="text-sm text-gray-600">
                        {new Date(chapter.publish_at) > new Date() 
                          ? `Scheduled: ${new Date(chapter.publish_at).toLocaleDateString()}`
                          : `Published: ${new Date(chapter.publish_at).toLocaleDateString()}`
                        }
                      </p>
                    )}
                  </div>
                  
                  {isAdvancedChapter(chapter) && (
                    <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                      <Icon icon="mdi:star" className="w-4 h-4 mr-1" />
                      Advanced
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => onDeleteChapter(chapter.id)}
                className="absolute top-3 right-2 sm:top-4 sm:right-4 p-1.5 sm:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                title="Delete chapter"
              >
                <Icon icon="mdi:delete-outline" className="w-5 h-5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 