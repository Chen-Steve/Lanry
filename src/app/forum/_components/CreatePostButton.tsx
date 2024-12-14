'use client';

import { useState } from 'react';
import { ForumPost } from '@/types/database';
import supabase from '@/lib/supabaseClient';
import { Icon } from '@iconify/react';

interface CreatePostButtonProps {
  mode: 'reply' | 'thread-reply';
  threadId: string;
  parentPostId?: string;
  replyToUsername?: string;
  onPostCreated: (post: ForumPost) => void;
}

export default function CreatePostButton({
  threadId,
  parentPostId,
  replyToUsername,
  onPostCreated
}: CreatePostButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return;
    setError(null);

    try {
      setIsSubmitting(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error('Authentication error. Please try logging in again.');
      }
      
      if (!session) {
        throw new Error('Please log in to reply to this thread.');
      }

      const response = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          threadId, 
          content,
          parentPostId 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to create reply');
      }
      
      const newPost = await response.json();
      onPostCreated(newPost);
      
      setContent('');
      setIsOpen(false);
    } catch (error) {
      console.error('Error creating reply:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return !isOpen ? (
    <button 
      onClick={() => setIsOpen(true)}
      className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
    >
      <Icon icon="mdi:reply" className="w-4 h-4" />
      Reply
    </button>
  ) : (
    <div className="mt-4 bg-gray-50 rounded-md p-3 border border-gray-200">
      <div className="text-sm text-gray-600 mb-2 flex items-center gap-2">
        <Icon icon="mdi:reply" className="w-4 h-4" />
        Replying to {replyToUsername ? (
          <span className="font-medium text-gray-900">@{replyToUsername}</span>
        ) : (
          'thread'
        )}
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={3}
            placeholder="Write your reply..."
            className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-black placeholder:text-gray-400"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button 
            type="button" 
            onClick={() => setIsOpen(false)}
            className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 text-sm"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
} 