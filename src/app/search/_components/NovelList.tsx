import React from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import type { Novel } from '@/types/database';

interface NovelListProps {
  novels: Novel[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export default function NovelList({ 
  novels, 
  isLoading,
  emptyMessage = 'No novels found'
}: NovelListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <div className="flex items-center gap-2">
          <Icon icon="eos-icons:loading" className="w-5 h-5 animate-spin" />
          Loading novels...
        </div>
      </div>
    );
  }

  if (novels.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <div className="space-y-1">
          <div className="text-4xl">📚</div>
          <div>{emptyMessage}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">
        Showing {novels.length} {novels.length === 1 ? 'novel' : 'novels'}
      </div>
      <div className="space-y-2">
        {novels.map((novel) => (
          <Link
            href={`/novels/${novel.id}`}
            key={novel.id}
            className="block p-3 bg-secondary rounded-lg border border-border hover:border-primary hover:bg-secondary/80 transition-colors"
          >
            <div className="space-y-2">
              <div>
                <h3 className="font-medium">{novel.title}</h3>
                <p className="text-sm text-muted-foreground">by {novel.author}</p>
              </div>
              {(novel.tags ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {(novel.tags ?? []).map(tag => (
                    <span
                      key={tag.id}
                      className="px-1.5 py-0.5 text-xs bg-accent rounded-full"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 