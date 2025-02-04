import { Novel } from '@/types/database';
import Link from 'next/link';
import NovelCover from './NovelCover';
import { Icon } from '@iconify/react';

interface AdvancedChaptersProps {
  novels: Novel[];
}

const AdvancedChapters = ({ novels }: AdvancedChaptersProps) => {
  if (novels.length === 0) return null;

  // Take only the first 5 novels
  const displayNovels = novels.slice(0, 5);

  return (
    <div className="mb-2">
      <div className="flex items-center gap-2 p-3">
        <Icon icon="mdi:lock" className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold border-b-2 border-primary pb-1">Advanced Chapters</h2>
      </div>
      

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
        {displayNovels.map(novel => {
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