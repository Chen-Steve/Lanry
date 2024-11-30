'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ForumThread, ForumPost } from '@/types/database';
import { Icon } from '@iconify/react';
import CreatePostButton from './CreatePostButton';

interface ThreadDetailProps {
  threadId: string;
}

export default function ThreadDetail({ threadId }: ThreadDetailProps) {
  const [thread, setThread] = useState<ForumThread | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadThread = async () => {
      try {
        // Fetch thread details
        const threadResponse = await fetch(`/api/forum/threads/${threadId}`);
        if (!threadResponse.ok) throw new Error('Failed to fetch thread');
        const threadData = await threadResponse.json();
        setThread(threadData);

        // Fetch thread posts
        const postsResponse = await fetch(`/api/forum/threads/${threadId}/posts`);
        if (!postsResponse.ok) throw new Error('Failed to fetch posts');
        const postsData = await postsResponse.json();
        setPosts(postsData);
      } catch (error) {
        console.error('Error loading thread:', error);
      } finally {
        setLoading(false);
      }
    };

    loadThread();
  }, [threadId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Icon icon="eos-icons:loading" className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="text-center py-8">
        <Icon icon="mdi:alert" className="w-16 h-16 mx-auto text-red-400 mb-4" />
        <p className="text-gray-500">Thread not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Thread Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/forum" className="hover:text-gray-700">Forum</Link>
          <Icon icon="mdi:chevron-right" className="w-4 h-4" />
          <Link href={`/forum/category/${thread.category_id}`} className="hover:text-gray-700">
            Back to Category
          </Link>
        </div>
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-2xl font-bold">
              {thread.is_pinned && (
                <span className="text-blue-500 mr-2" title="Pinned">
                  <Icon icon="mdi:pin" className="inline-block w-5 h-5" />
                </span>
              )}
              {thread.title}
            </h1>
            {thread.is_locked && (
              <span className="text-red-500" title="Locked">
                <Icon icon="mdi:lock" className="w-5 h-5" />
              </span>
            )}
          </div>
          <div className="prose max-w-none mb-4">{thread.content}</div>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Icon icon="mdi:account" className="w-4 h-4" />
              {thread.author.username}
            </div>
            <div className="flex items-center gap-2">
              <Icon icon="mdi:clock-outline" className="w-4 h-4" />
              {new Date(thread.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4 mb-8">
        {posts.map((post) => (
          <div key={post.id} className="bg-white border rounded-lg p-6">
            <div className="prose max-w-none mb-4">{post.content}</div>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Icon icon="mdi:account" className="w-4 h-4" />
                {post.author.username}
              </div>
              <div className="flex items-center gap-2">
                <Icon icon="mdi:clock-outline" className="w-4 h-4" />
                {new Date(post.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reply Button */}
      {!thread.is_locked && (
        <div className="flex justify-end">
          <CreatePostButton 
            mode="reply"
            threadId={threadId} 
            onPostCreated={(newPost: ForumPost) => setPosts([...posts, newPost])} 
          />
        </div>
      )}
    </div>
  );
} 