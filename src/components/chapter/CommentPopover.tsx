'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import type { ChapterComment } from '@/types/database';

interface CommentPopoverProps {
  position: { x: number; y: number };
  paragraphId: string;
  comments: ChapterComment[];
  onClose: () => void;
  onAddComment: (content: string) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export default function CommentPopover({
  position,
  paragraphId,
  comments,
  onClose,
  onAddComment,
  isAuthenticated,
  isLoading
}: CommentPopoverProps) {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    onAddComment(newComment.trim());
    setNewComment('');
  };

  return (
    <div
      className="fixed z-50 bg-white rounded-lg shadow-xl border p-4 w-80"
      style={{
        left: `${Math.min(position.x, window.innerWidth - 320)}px`,
        top: `${position.y + 10}px`
      }}
      data-paragraph-id={paragraphId}
    >
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-semibold">Comments</h3>
          <p className="text-xs text-gray-500">Paragraph #{paragraphId}</p>
        </div>
        <button 
          onClick={onClose} 
          className="text-gray-500 hover:text-gray-700"
          aria-label="Close comments"
        >
          <Icon icon="mdi:close" />
        </button>
      </div>

      {/* Comments list */}
      <div className="max-h-60 overflow-y-auto mb-4">
        {comments.map((comment) => (
          <div key={comment.id} className="mb-3 pb-3 border-b last:border-b-0">
            <div className="flex justify-between items-start">
              <span className="font-medium text-sm">{comment.profile.username}</span>
              <span className="text-xs text-gray-500">
                {formatDate(comment.created_at)}
              </span>
            </div>
            <p className="text-sm mt-1">{comment.content}</p>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-sm text-gray-500 text-center">No comments yet</p>
        )}
      </div>

      {/* New comment form */}
      {isLoading ? (
        <div className="text-center">
          <Icon icon="eos-icons:loading" className="animate-spin" />
        </div>
      ) : isAuthenticated ? (
        <form onSubmit={handleSubmit} className="mt-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full p-2 border rounded-lg text-sm resize-none"
            rows={3}
          />
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm disabled:opacity-50"
          >
            Post
          </button>
        </form>
      ) : (
        <p className="text-sm text-gray-500 text-center">
          <Link href="/auth" className="text-blue-500 hover:underline">
            Sign in
          </Link>{' '}
          to comment
        </p>
      )}
    </div>
  );
} 