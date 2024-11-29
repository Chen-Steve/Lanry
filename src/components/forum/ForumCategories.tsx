'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ForumCategory } from '@/types/database';
import { forumService } from '@/services/forumService';
import { Icon } from '@iconify/react';

export default function ForumCategories() {
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await forumService.getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Icon icon="eos-icons:loading" className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

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