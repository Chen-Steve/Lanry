import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { ForumThread } from '@/types/database';

interface ThreadListProps {
  categoryId: string;
}

export default function ThreadList({ categoryId }: ThreadListProps) {
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const response = await fetch(`/api/forum/threads/category/${categoryId}`);
        if (!response.ok) throw new Error('Failed to fetch threads');
        const data = await response.json();
        setThreads(data);
      } catch (error) {
        console.error('Error fetching threads:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchThreads();
  }, [categoryId]);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading threads...</p>
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="text-center py-8">
        <Icon icon="mdi:forum-outline" className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">No threads in this category yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {threads.map((thread) => (
        <div
          key={thread.id}
          className="border rounded-lg p-4 hover:bg-gray-50 transition"
        >
          <Link href={`/forum/thread/${thread.id}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-black group-hover:text-blue-600 transition">
                  {thread.title}
                </h2>
                <p className="text-gray-600 mt-1 line-clamp-2">{thread.content}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Icon icon="mdi:account" className="w-4 h-4" />
                    {thread.author.username}
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon icon="mdi:clock-outline" className="w-4 h-4" />
                    {new Date(thread.created_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon icon="mdi:comment-outline" className="w-4 h-4" />
                    {thread.reply_count} {thread.reply_count === 1 ? 'reply' : 'replies'}
                  </span>
                </div>
              </div>
              {thread.is_pinned && (
                <Icon icon="mdi:pin" className="w-5 h-5 text-blue-500" />
              )}
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
} 