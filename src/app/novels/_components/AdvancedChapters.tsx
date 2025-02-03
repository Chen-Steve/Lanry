import { Icon } from '@iconify/react';
import Link from 'next/link';
import { Novel } from '@/types/database';
import NovelCover from './NovelCover';

interface AdvancedChaptersProps {
  novels: Novel[];
  showAdvancedSection: boolean;
  onToggleSection: () => void;
}

const AdvancedChapters = ({ novels, showAdvancedSection, onToggleSection }: AdvancedChaptersProps) => {
  if (novels.length === 0) return null;

  return (
    <div className="mb-2">
      <button
        onClick={onToggleSection}
        className="w-full flex items-center justify-between p-3 bg-card hover:bg-accent/50 border border-border rounded-lg transition-colors mb-2"
      >
        <div className="flex items-center gap-2">
          <h2 className="text-base font-medium">Advanced Chapters</h2>
        </div>
        <Icon 
          icon={showAdvancedSection ? "mdi:chevron-up" : "mdi:chevron-down"} 
          className="w-5 h-5 text-muted-foreground"
        />
      </button>
      
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 transition-all duration-300 ${
        showAdvancedSection 
          ? 'opacity-100 max-h-[2000px]' 
          : 'opacity-0 max-h-0 overflow-hidden'
      }`}>
        {novels.map(novel => {
          const advancedChapters = novel.chapters?.filter(chapter => {
            const publishDate = chapter.publish_at ? new Date(chapter.publish_at) : null;
            return publishDate && publishDate > new Date() && chapter.coins > 0;
          })
          .sort((a, b) => {
            const dateA = a.publish_at ? new Date(a.publish_at) : new Date();
            const dateB = b.publish_at ? new Date(b.publish_at) : new Date();
            return dateA.getTime() - dateB.getTime();
          })
          .slice(0, 3) || [];
          
          return (
            <Link
              key={novel.id}
              href={`/novels/${novel.slug}`}
              className="group relative flex gap-2 p-2 bg-card hover:bg-accent/50 border border-border rounded-lg transition-colors"
            >
              <div className="w-16 h-24 relative rounded-md overflow-hidden">
                <NovelCover
                  coverUrl={novel.coverImageUrl}
                  title={novel.title}
                  isPriority={true}
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {novel.title}
                </h3>
                
                <div className="mt-1 space-y-0.5">
                  {advancedChapters.map(chapter => (
                    <div key={chapter.id} className="flex items-center gap-1.5 text-xs">
                      <span className="text-muted-foreground">
                        Ch.{chapter.chapter_number}
                        {chapter.part_number && `.${chapter.part_number}`}
                      </span>
                      <span className="text-primary">
                        {chapter.publish_at && new Date(chapter.publish_at).toLocaleDateString(undefined, { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default AdvancedChapters; 