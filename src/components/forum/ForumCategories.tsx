'use client';

import Link from 'next/link';
import { CategoryBasicInfo } from '@/types/database';
import { Icon } from '@iconify/react';

type ForumCategoriesProps = {
  categories: CategoryBasicInfo[];
}

export default function ForumCategories({ categories }: ForumCategoriesProps) {
  if (categories.length === 0) {
    return (
      <div className="text-center py-8">
        <Icon icon="mdi:forum-outline" className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">No categories found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <div
          key={category.id}
          className="border rounded-lg p-4 hover:bg-gray-50 transition group"
        >
          <Link href={`/forum/category/${category.id}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-semibold group-hover:text-blue-600 transition">
                  {category.name}
                </h2>
                <p className="text-gray-600 mt-1">{category.description}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Icon icon="mdi:message-outline" className="w-4 h-4" />
                    {category.thread_count} {category.thread_count === 1 ? 'thread' : 'threads'}
                  </span>
                  {category.latest_thread && (
                    <span className="flex items-center gap-1">
                      <Icon icon="mdi:clock-outline" className="w-4 h-4" />
                      Last activity: {new Date(category.latest_thread).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-gray-400 group-hover:translate-x-1 transition-transform">
                <Icon icon="mdi:chevron-right" className="w-6 h-6" />
              </div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
} 