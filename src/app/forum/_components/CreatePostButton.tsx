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
      className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
    >
      <Icon icon="mdi:reply" className="w-4 h-4" />
      Reply
    </button>
  ) : (
    <div className="mt-4 bg-accent/50 rounded-md p-3 border border-border">
      <div className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
        <Icon icon="mdi:reply" className="w-4 h-4" />
        Replying to {replyToUsername ? (
          <span className="font-medium text-foreground">@{replyToUsername}</span>
        ) : (
          'thread'
        )}
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
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
            className="w-full rounded-md border border-border bg-background p-2 focus:border-primary focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground transition-colors"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button 
            type="button" 
            onClick={() => setIsOpen(false)}
            className="px-3 py-1.5 border border-border text-foreground rounded-md hover:bg-accent transition-colors text-sm"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
} 