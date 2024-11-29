'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ForumThread } from '@/types/database';
import { forumService } from '@/services/forumService';
import { Icon } from '@iconify/react';

interface ThreadListProps {
  categoryId: string;
}

export default function ThreadList({ categoryId }: ThreadListProps) {
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadThreads = async () => {
      try {
        const data = await forumService.getThreadsByCategory(categoryId);
        setThreads(data);
      } catch (error) {
        console.error('Error loading threads:', error);
      } finally {
        setLoading(false);
      }
    };

    loadThreads();
  }, [categoryId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Icon icon="eos-icons:loading" className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="text-center py-8">
        <Icon icon="mdi:forum-outline" className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">No threads yet. Be the first to create one!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {threads.map((thread) => (
        <div
          key={thread.id}
          className="border rounded-lg p-4 hover:bg-gray-50 transition group"
        >
          <Link href={`/forum/thread/${thread.id}`}>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {thread.is_pinned && (
                    <span className="text-blue-500" title="Pinned">
                      <Icon icon="mdi:pin" className="w-4 h-4" />
                    </span>
                  )}
                  {thread.is_locked && (
                    <span className="text-red-500" title="Locked">
                      <Icon icon="mdi:lock" className="w-4 h-4" />
                    </span>
                  )}
                  <h3 className="text-lg font-semibold group-hover:text-blue-600 transition">
                    {thread.title}
                  </h3>
                </div>
                <p className="text-gray-600 line-clamp-2 mb-2">{thread.content}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Icon icon="mdi:account" className="w-4 h-4" />
                    {thread.author.username}
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon icon="mdi:clock-outline" className="w-4 h-4" />
                    {new Date(thread.created_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon icon="mdi:message-outline" className="w-4 h-4" />
                    {thread.post_count} {thread.post_count === 1 ? 'reply' : 'replies'}
                  </span>
                </div>
              </div>
              {thread.last_post_at && (
                <div className="text-sm text-gray-500 text-right">
                  <div>Last Reply</div>
                  <div>{new Date(thread.last_post_at).toLocaleDateString()}</div>
                </div>
              )}
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
} 