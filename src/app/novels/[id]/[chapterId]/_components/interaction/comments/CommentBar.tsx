'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import type { ChapterComment as BaseChapterComment } from '@/types/database';

// Extend the base type to include avatar_url
interface ChapterComment extends Omit<BaseChapterComment, 'profile'> {
  profile?: {
    username: string | null;
    avatar_url?: string;
    id?: string;
    role: 'USER' | 'AUTHOR' | 'TRANSLATOR';
  };
}

interface CommentBarProps {
  paragraphId: string;
  comments: ChapterComment[];
  onClose: () => void;
  onAddComment: (content: string) => void;
  onDeleteComment: (commentId: string) => Promise<void>;
  onUpdateComment: (commentId: string, content: string) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  novelId: string;
  authorId: string;
}

export default function CommentBar({
  paragraphId,
  comments,
  onClose,
  onAddComment,
  onDeleteComment,
  onUpdateComment,
  isAuthenticated,
  isLoading,
  userId,
}: CommentBarProps) {
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Show the comment bar after mount to trigger animation
    setIsVisible(true);
    return () => setIsVisible(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    onAddComment(newComment.trim());
    setNewComment('');
  };

  const handleEdit = (commentId: string, content: string) => {
    setEditingCommentId(commentId);
    setEditContent(content);
  };

  const handleUpdate = async (commentId: string) => {
    if (!editContent.trim()) return;
    await onUpdateComment(commentId, editContent.trim());
    setEditingCommentId(null);
    setEditContent('');
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent('');
  };

  const handleCloseWithAnimation = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 400);
  }, [onClose]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCloseWithAnimation();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleCloseWithAnimation]);

  return createPortal(
    <>
      <div
        className={`fixed inset-0 bg-black/30 z-40 comment-overlay ${isVisible ? 'show' : ''}`}
        onClick={handleCloseWithAnimation}
      />
      <div
        ref={barRef}
        className={`comment-sidebar fixed right-0 top-0 bottom-0 w-full md:w-[400px] bg-container shadow-lg z-50 
                  overflow-hidden flex flex-col ${isVisible ? 'show' : ''}`}
      >
        <div className="h-full flex flex-col">
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="font-semibold text-black dark:text-white">Comments</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Paragraph #{paragraphId}</p>
            </div>
            <button 
              onClick={handleCloseWithAnimation} 
              className="p-2 hover:bg-accent/50 rounded-full transition-colors text-black dark:text-white"
              aria-label="Close comments"
            >
              <Icon icon="mdi:close" className="text-xl" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-card rounded-lg p-3">
                <div className="flex gap-3">
                  <Link href={`/user-dashboard?id=${comment.profile_id}`} className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-500">
                      {comment.profile?.avatar_url ? (
                        <img
                          src={comment.profile.avatar_url}
                          alt={comment.profile.username || 'User avatar'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent && comment.profile) {
                              parent.innerHTML = comment.profile.username?.[0]?.toUpperCase() || '?';
                              parent.className = "w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold";
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-sm font-semibold">
                          {comment.profile?.username?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {comment.profile?.username ? (
                          <div className="flex items-center gap-2 min-w-0">
                            <Link 
                              href={`/user-dashboard?id=${comment.profile_id}`}
                              className="text-sm font-medium text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
                            >
                              {comment.profile?.username}
                            </Link>
                            {comment.profile?.role && comment.profile.role !== 'USER' && (
                              <span className={`px-1 py-0.5 text-xs font-medium rounded inline-flex items-center flex-shrink-0 ${
                                comment.profile.role === 'AUTHOR' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                                comment.profile.role === 'TRANSLATOR' ? 'bg-blue-100 dark:bg-blue-900/30' :
                                comment.profile.role === '' ? 'bg-purple-100 dark:bg-purple-900/30' :
                                'bg-gray-100 dark:bg-gray-800'
                              } text-black dark:text-gray-200`}>
                                {comment.profile.role.charAt(0) + comment.profile.role.slice(1).toLowerCase()}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm font-medium text-black dark:text-white">
                            Anonymous
                          </span>
                        )}
                        <span className="text-xs text-gray-600 dark:text-gray-400 flex-shrink-0">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      {userId === comment.profile_id && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEdit(comment.id, comment.content)}
                            className="p-1 hover:bg-accent/50 rounded-full transition-colors flex-shrink-0"
                            aria-label="Edit comment"
                          >
                            <Icon icon="mdi:pencil-outline" className="text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteComment(comment.id)}
                            className="p-1 hover:bg-accent/50 rounded-full transition-colors flex-shrink-0"
                            aria-label="Delete comment"
                          >
                            <Icon icon="mdi:delete-outline" className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    {editingCommentId === comment.id ? (
                      <div className="mt-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          placeholder="Edit your comment..."
                          className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm resize-none 
                                   bg-card focus:ring-2 focus:ring-amber-500 focus:border-transparent 
                                   text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          rows={2}
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleUpdate(comment.id)}
                            className="px-3 py-1 bg-amber-500 text-white rounded-lg text-sm font-medium 
                                     hover:bg-amber-600 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 
                                     rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 
                                     transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm mt-1 text-black dark:text-gray-200">{comment.content}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">No comments yet</p>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-4">
              <Icon icon="eos-icons:loading" className="animate-spin text-2xl text-gray-600 dark:text-gray-400" />
            </div>
          ) : isAuthenticated ? (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <form onSubmit={handleSubmit}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg text-sm resize-none 
                           bg-[#faf7f2] dark:bg-zinc-800 focus:ring-2 focus:ring-amber-500 focus:border-transparent 
                           text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  rows={3}
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="mt-2 w-full py-2 bg-amber-500 text-white rounded-lg text-sm font-medium 
                           disabled:opacity-50 hover:bg-amber-600 transition-colors"
                >
                  Post Comment
                </button>
              </form>
            </div>
          ) : (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
              <Link href="/auth" className="text-amber-600 dark:text-amber-500 hover:underline text-sm">
                Sign in to comment
              </Link>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
} 