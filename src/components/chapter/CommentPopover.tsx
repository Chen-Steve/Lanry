'use client';

import { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    onAddComment(newComment.trim());
    setNewComment('');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const calculatePosition = () => {
    const x = Math.min(position.x, window.innerWidth - 320);
    const y = Math.min(position.y + 10, window.innerHeight - 400);
    return { x, y };
  };

  const popoverPosition = calculatePosition();

  return createPortal(
    <AnimatePresence>
      <motion.div
        ref={popoverRef}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="fixed z-50 bg-white rounded-lg shadow-xl border p-4 w-80 text-black"
        style={{
          left: `${popoverPosition.x}px`,
          top: `${popoverPosition.y}px`
        }}
        data-paragraph-id={paragraphId}
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-semibold text-black">Comments</h3>
            <p className="text-xs text-black">Paragraph #{paragraphId}</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-black hover:text-gray-800"
            aria-label="Close comments"
          >
            <Icon icon="mdi:close" />
          </button>
        </div>

        <div className="max-h-60 overflow-y-auto mb-4 scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
          {comments.map((comment) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-3 pb-3 border-b last:border-b-0"
            >
              <div className="flex justify-between items-start">
                <span className="font-medium text-sm text-black">{comment.profile.username}</span>
                <span className="text-xs text-black">
                  {formatDate(comment.created_at)}
                </span>
              </div>
              <p className="text-sm mt-1 text-black">{comment.content}</p>
            </motion.div>
          ))}
          {comments.length === 0 && (
            <p className="text-sm text-black text-center">No comments yet</p>
          )}
        </div>

        {isLoading ? (
          <div className="text-center text-black">
            <Icon icon="eos-icons:loading" className="animate-spin" />
          </div>
        ) : isAuthenticated ? (
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleSubmit}
            className="mt-3"
          >
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full p-2 border rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-gray-500"
              rows={3}
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm disabled:opacity-50
                       hover:bg-blue-600 transition-colors duration-200"
            >
              Post
            </button>
          </motion.form>
        ) : (
          <p className="text-sm text-black text-center">
            <Link href="/auth" className="text-blue-500 hover:underline">
              Sign in
            </Link>{' '}
            to comment
          </p>
        )}
      </motion.div>
    </AnimatePresence>,
    document.body
  );
} 