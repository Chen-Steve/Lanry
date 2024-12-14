'use client';

import { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { ChapterComment } from '@/types/database';

interface CommentBarProps {
  paragraphId: string;
  comments: ChapterComment[];
  onClose: () => void;
  onAddComment: (content: string) => void;
  onDeleteComment: (commentId: string) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  novelId: string;
}

export default function CommentBar({
  paragraphId,
  comments,
  onClose,
  onAddComment,
  onDeleteComment,
  isAuthenticated,
  isLoading,
  userId,
}: CommentBarProps) {
  const [newComment, setNewComment] = useState('');
  const barRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    onAddComment(newComment.trim());
    setNewComment('');
  };

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />
      <motion.div
        key="sidebar"
        ref={barRef}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 bottom-0 w-full md:w-[400px] bg-white shadow-lg z-50 
                  overflow-hidden flex flex-col"
      >
        <div className="h-full flex flex-col">
          <div className="flex justify-between items-center p-4 border-b">
            <div>
              <h3 className="font-semibold text-black">Comments</h3>
              <p className="text-xs text-gray-600">Paragraph #{paragraphId}</p>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-black"
              aria-label="Close comments"
            >
              <Icon icon="mdi:close" className="text-xl" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {comment.profile?.username ? (
                      <Link 
                        href={`/user-dashboard?id=${comment.profile_id}`}
                        className="text-sm font-medium text-black hover:text-blue-600 transition-colors"
                      >
                        {comment.profile.username}
                      </Link>
                    ) : (
                      <span className="text-sm font-medium text-black">
                        Anonymous
                      </span>
                    )}
                    <span className="text-xs text-gray-600">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  {userId === comment.profile_id && (
                    <button
                      onClick={() => onDeleteComment(comment.id)}
                      className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                      aria-label="Delete comment"
                    >
                      <Icon icon="mdi:delete-outline" className="text-gray-500 hover:text-red-500 w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-sm mt-1 text-black">{comment.content}</p>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-sm text-gray-600 text-center py-4">No comments yet</p>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-4">
              <Icon icon="eos-icons:loading" className="animate-spin text-2xl text-gray-600" />
            </div>
          ) : isAuthenticated ? (
            <div className="p-4 border-t">
              <form onSubmit={handleSubmit}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full p-3 border rounded-lg text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black placeholder-gray-500"
                  rows={3}
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="mt-2 w-full py-2 bg-purple-600 text-white rounded-lg text-sm font-medium 
                           disabled:opacity-50 hover:bg-purple-700 transition-colors"
                >
                  Post Comment
                </button>
              </form>
            </div>
          ) : (
            <div className="p-4 border-t text-center">
              <Link href="/auth" className="text-purple-600 hover:underline text-sm">
                Sign in to comment
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
} 