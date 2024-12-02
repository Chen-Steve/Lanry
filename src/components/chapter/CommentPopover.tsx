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
  novelId: string;
}

export default function CommentPopover({
  position,
  paragraphId,
  comments,
  onClose,
  onAddComment,
  isAuthenticated,
  isLoading,
}: CommentPopoverProps) {
  const [newComment, setNewComment] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);
  const isMobile = window.innerWidth < 768;

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

  if (isMobile) {
    return createPortal(
      <AnimatePresence>
        <motion.div
          ref={popoverRef}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 rounded-t-md select-none touch-none"
          style={{
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            WebkitTapHighlightColor: 'transparent',
            WebkitTouchCallout: 'none',
            userSelect: 'none',
          }}
        >
          <div className="px-4 py-6 space-y-4 select-none">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-black">Comments</h3>
                <p className="text-xs text-gray-600">Paragraph #{paragraphId}</p>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-black select-none touch-none"
                aria-label="Close comments"
              >
                <Icon icon="mdi:close" className="text-xl" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-md p-4 flex-1 overflow-y-auto max-h-[40vh] scrollbar-thin scrollbar-thumb-gray-300 select-text">
              {comments.map((comment) => (
                <div key={comment.id} className="mb-4 last:mb-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {comment.profile?.username ?? 'Anonymous'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{comment.content}</p>
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
              <div className="bg-gray-50 rounded-md">
                <form onSubmit={handleSubmit}>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full p-3 border-2 border-gray-300 rounded-t-lg text-base resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black placeholder-gray-500 bg-white"
                    rows={5}
                    style={{ minHeight: '120px' }}
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="w-full py-4 bg-purple-600 text-white rounded-b-lg text-base font-medium disabled:opacity-50
                             hover:bg-purple-700 transition-colors duration-200"
                  >
                    Post
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-md p-4 text-center">
                <Link href="/auth" className="text-purple-600 hover:underline text-sm">
                  Sign in to comment
                </Link>
              </div>
            )}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black z-40"
          onClick={onClose}
        />
      </AnimatePresence>,
      document.body
    );
  }

  // Desktop view remains unchanged
  const popoverPosition = {
    x: Math.min(position.x, window.innerWidth - 320),
    y: Math.min(position.y + 10, window.innerHeight - 400)
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        ref={popoverRef}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="fixed z-50 bg-white rounded-lg shadow-xl border p-4 text-black"
        style={{
          left: `${popoverPosition.x}px`,
          top: `${popoverPosition.y}px`,
          width: '320px',
          height: 'auto',
          maxHeight: window.innerHeight - 160, // Ensure it doesn't overflow viewport
          display: 'flex',
          flexDirection: 'column'
        }}
        data-paragraph-id={paragraphId}
        onClick={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
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
            <Icon icon="mdi:close" className="text-xl" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto mb-4 scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
          {comments.map((comment) => (
            <div key={comment.id} className="mb-4 last:mb-0">
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  {comment.profile?.username ?? 'Anonymous'}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDate(comment.created_at)}
                </span>
              </div>
              <p className="text-sm mt-1">{comment.content}</p>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-sm text-black text-center py-4">No comments yet</p>
          )}
        </div>

        {isLoading ? (
          <div className="text-center text-black py-4">
            <Icon icon="eos-icons:loading" className="animate-spin text-2xl" />
          </div>
        ) : isAuthenticated ? (
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleSubmit}
            className="mt-auto" // Push to bottom
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
              className="mt-2 w-full py-3 bg-blue-500 text-white rounded-lg text-sm disabled:opacity-50
                       hover:bg-blue-600 transition-colors duration-200"
            >
              Post
            </button>
          </motion.form>
        ) : (
          <p className="text-sm text-black text-center mt-auto py-4">
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