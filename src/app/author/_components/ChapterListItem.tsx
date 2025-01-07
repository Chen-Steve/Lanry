import { Icon } from '@iconify/react';
import { ChapterListChapter } from '../_types/authorTypes';

export const isAdvancedChapter = (chapter: ChapterListChapter): boolean => {
  const now = new Date();
  const publishDate = chapter.publish_at ? new Date(chapter.publish_at) : null;
  
  return (publishDate !== null && publishDate > now) && 
         (chapter.coins !== undefined && chapter.coins > 0);
};

interface ChapterListItemProps {
  chapter: ChapterListChapter;
  editingChapterId?: string;
  onEditChapter: (chapter: ChapterListChapter) => void;
  onDeleteClick: (chapterId: string) => void;
  onUnassignChapter?: (chapterId: string) => void;
}

export default function ChapterListItem({
  chapter,
  editingChapterId,
  onEditChapter,
  onDeleteClick,
  onUnassignChapter
}: ChapterListItemProps) {
  return (
    <div
      className={`relative group ${
        editingChapterId === chapter.id 
          ? 'bg-primary/10 hover:bg-primary/20' 
          : 'hover:bg-accent/50'
      }`}
    >
      <div 
        onClick={() => onEditChapter(chapter)}
        className="p-3 sm:p-4 cursor-pointer"
      >
        <div className="flex flex-col gap-1 pr-20">
          <div className="flex-1">
            <h4 className="font-medium text-foreground text-sm">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditChapter(chapter);
                }}
                className="mr-2 px-2 py-0.5 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded transition-colors"
              >
                Edit
              </button>
              Chapter {chapter.chapter_number}
              {chapter.part_number && (
                <span className="text-muted-foreground">
                  {" "}Part {chapter.part_number}
                </span>
              )}
              {chapter.title && (
                <span className="text-muted-foreground ml-1">: {chapter.title}</span>
              )}
            </h4>
            {chapter.publish_at && (
              <p className="text-sm text-muted-foreground">
                {new Date(chapter.publish_at) > new Date() 
                  ? `Scheduled: ${new Date(chapter.publish_at).toLocaleDateString()}`
                  : `Published: ${new Date(chapter.publish_at).toLocaleDateString()}`
                }
              </p>
            )}
          </div>
          
          {isAdvancedChapter(chapter) && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              <Icon icon="mdi:star" className="w-4 h-4 mr-1" />
              Advanced
            </span>
          )}
        </div>
      </div>

      <div className="absolute top-2 right-1 sm:top-2 sm:right-2 flex items-center gap-1">
        {chapter.volumeId && onUnassignChapter && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUnassignChapter(chapter.id);
            }}
            className="px-2 py-0.5 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
          >
            Unassign
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick(chapter.id);
          }}
          className="p-1 text-muted-foreground hover:text-red-500 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full transition-colors"
          title="Delete chapter"
        >
          <Icon icon="mdi:delete-outline" className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
} 