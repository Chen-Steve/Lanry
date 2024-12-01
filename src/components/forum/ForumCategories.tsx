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
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center py-8">
          <Icon icon="mdi:forum-outline" className="w-16 h-16 mx-auto text-black mb-4" />
          <p className="text-black">No categories found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4">
      <div className="space-y-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className="border rounded-lg p-4 hover:bg-gray-50 transition group"
          >
            <Link href={`/forum/category/${category.id}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl text-black font-semibold group-hover:text-blue-600 transition flex items-center gap-2">
                    <Icon icon="pepicons-print:text-bubbles" className="w-12 h-12" />
                    {category.name}
                  </h2>
                  <p className="text-black mt-1">{category.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-black">
                    <span className="flex items-center gap-1">
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
                <div className="text-black group-hover:translate-x-1 transition-transform">
                  <Icon icon="mdi:chevron-right" className="w-6 h-6" />
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
} 