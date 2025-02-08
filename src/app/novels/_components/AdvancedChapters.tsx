import { Icon } from '@iconify/react';
import Link from 'next/link';
import { Novel } from '@/types/database';

interface AdvancedChaptersProps {
  novels: Novel[];
}

const AdvancedChapters = ({ novels }: AdvancedChaptersProps) => {
  if (!novels?.length) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 p-3">
        <Icon icon="mdi:lock" className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold border-b-2 border-primary pb-1">Advanced Chapters</h2>
      </div>

      <div className="divide-y divide-border">
        {novels.map(novel => (
          <Link
            key={novel.id}
            href={`/novels/${novel.slug}`}
            className="group block px-3 py-1.5 hover:bg-accent/50 transition-colors"
          >
            <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
              {novel.title}
            </h3>
            
            <div className="flex flex-wrap gap-x-4">
              {novel.chapters?.map((chapter, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
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
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdvancedChapters; 