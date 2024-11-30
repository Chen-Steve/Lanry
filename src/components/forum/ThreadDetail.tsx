'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ForumThread, ForumPost } from '@/types/database';
import { Icon } from '@iconify/react';
import CreatePostButton from './CreatePostButton';
import { toast } from 'react-hot-toast';
import supabase from '@/lib/supabaseClient';

interface ThreadDetailProps {
  threadId: string;
}

interface VoteControlsProps {
  score: number;
  onUpvote: () => void;
  onDownvote: () => void;
}

function VoteControls({ score = 0, onUpvote, onDownvote }: VoteControlsProps) {
  return (
    <div className="flex flex-col items-center mr-4">
      <button 
        onClick={onUpvote}
        aria-label="Upvote" 
        className="text-gray-400 hover:text-orange-500 transition-colors p-1"
      >
        <Icon icon="pepicons-print:arrow-up" className="w-5 h-5" />
      </button>
      <span className="text-sm font-medium my-1 text-gray-700">{score}</span>
      <button 
        onClick={onDownvote}
        aria-label="Downvote" 
        className="text-gray-400 hover:text-blue-500 transition-colors p-1"
      >
        <Icon icon="pepicons-print:arrow-down" className="w-5 h-5" />
      </button>
    </div>
  );
}

export default function ThreadDetail({ threadId }: ThreadDetailProps) {
  const [thread, setThread] = useState<ForumThread | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState<string>('');
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    const loadThread = async () => {
      try {
        // Fetch thread details
        const threadResponse = await fetch(`/api/forum/threads/${threadId}`);
        if (!threadResponse.ok) throw new Error('Failed to fetch thread');
        const threadData = await threadResponse.json();
        setThread(threadData);

        // Fetch category details
        const categoryResponse = await fetch(`/api/forum/categories/${threadData.category_id}`);
        if (categoryResponse.ok) {
          const categoryData = await categoryResponse.json();
          setCategoryName(categoryData.name);
        }

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

  const handleVote = async (type: 'thread' | 'post', id: string, direction: 'up' | 'down') => {
    if (isVoting) return;
    
    try {
      setIsVoting(true);
      const response = await fetch(`/api/forum/${type}s/${id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ direction })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to vote');
      }
      
      const { score } = await response.json();
      
      if (type === 'thread') {
        setThread(prev => prev ? { ...prev, score } : null);
      } else {
        setPosts(prev => prev.map(post => 
          post.id === id ? { ...post, score } : post
        ));
      }
    } catch (error: unknown) {
      console.error('Error voting:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to vote. Please try again.');
    } finally {
      setIsVoting(false);
    }
  };

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
    <div className="max-w-3xl mx-auto">
      {/* Thread Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
          <Link href="/forum" className="hover:text-gray-700">Forum</Link>
          <Icon icon="mdi:chevron-right" className="w-4 h-4" />
          <Link href={`/forum/category/${thread.category_id}`} className="hover:text-gray-700">
            r/{categoryName}
          </Link>
        </div>
        <div className="bg-white rounded p-4 hover:border-gray-300 border border-gray-200">
          <div className="flex">
            <VoteControls 
              score={thread.score || 0}
              onUpvote={() => handleVote('thread', thread.id, 'up')}
              onDownvote={() => handleVote('thread', thread.id, 'down')}
            />
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-xl font-medium text-gray-900">
                  {thread.is_pinned && (
                    <span className="text-green-600 mr-2" title="Pinned">
                      <Icon icon="mdi:pin" className="inline-block w-4 h-4" />
                    </span>
                  )}
                  {thread.title}
                </h1>
                {thread.is_locked && (
                  <span className="text-red-500" title="Locked">
                    <Icon icon="mdi:lock" className="w-4 h-4" />
                  </span>
                )}
              </div>
              <div className="prose max-w-none mb-2 text-gray-900">{thread.content}</div>
              <div className="text-xs text-gray-500">
                Posted by u/{thread.author.username} • {new Date(thread.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-3">
        {posts.map((post) => (
          <div key={post.id} className="bg-white rounded p-4 hover:border-gray-300 border border-gray-200">
            <div className="flex">
              <VoteControls 
                score={post.score || 0}
                onUpvote={() => handleVote('post', post.id, 'up')}
                onDownvote={() => handleVote('post', post.id, 'down')}
              />
              <div className="flex-1">
                <div className="prose max-w-none mb-2 text-gray-900">{post.content}</div>
                <div className="text-xs text-gray-500">
                  <span className="font-medium">u/{post.author.username}</span>
                  {' • '}
                  {new Date(post.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reply Button */}
      {!thread.is_locked && (
        <div className="flex justify-start mt-4">
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