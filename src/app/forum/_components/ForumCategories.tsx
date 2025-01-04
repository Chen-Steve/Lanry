'use client';

import Link from 'next/link';
import { CategoryBasicInfo } from '@/types/database';
import { Icon } from '@iconify/react';

type ForumCategoriesProps = {
  categories: CategoryBasicInfo[];
}

function EmptyState() {
  return (
    <div className="text-center py-6">
      <Icon icon="mdi:forum-outline" className="w-12 h-12 mx-auto text-foreground mb-2" />
      <p className="text-foreground">No categories found.</p>
    </div>
  );
}

function CategoryStats({ 
  threadCount, 
  latestThread 
}: { 
  threadCount: number; 
  latestThread?: Date | null;
}) {
  return (
    <div className="flex items-center gap-3 text-sm text-gray-600">
      <span>{threadCount} {threadCount === 1 ? 'thread' : 'threads'}</span>
      {latestThread && (
        <>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Icon icon="mdi:clock-outline" className="w-4 h-4" />
            {latestThread.toLocaleDateString()}
          </span>
        </>
      )}
    </div>
  );
}

export default function ForumCategories({ categories }: ForumCategoriesProps) {
  if (categories.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4">
      <div className="divide-y">
        {categories.map((category) => (
          <Link 
            key={category.id}
            href={`/forum/category/${category.id}`}
            className="block py-3 hover:bg-accent transition group"
          >
            <div className="flex text-foreground items-center gap-3">
              <Icon 
                icon="pepicons-print:text-bubbles" 
                className="w-8 h-8 flex-shrink-0" 
              />
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-medium text-foreground group-hover:text-primary transition truncate">
                  {category.name}
                </h2>
                <p className="hidden sm:block text-sm text-muted-foreground line-clamp-1">
                  {category.description}
                </p>
                <CategoryStats 
                  threadCount={category.thread_count} 
                  latestThread={category.latest_thread ? new Date(category.latest_thread) : null}
                />
              </div>
              <Icon 
                icon="mdi:chevron-right" 
                className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" 
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 