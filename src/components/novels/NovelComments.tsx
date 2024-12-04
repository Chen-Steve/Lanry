import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { formatRelativeDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import supabase from '@/lib/supabaseClient';
import type { NovelComment } from '@/types/database';

interface SupabaseComment {
  id: string;
  content: string;
  created_at: string;
  profile_id: string;
  novel_id: string;
  updated_at: string;
  profile: {
    username: string | null;
  };
}

interface NovelCommentsProps {
  novelId: string;
  isAuthenticated: boolean;
}

export const NovelComments = ({ novelId, isAuthenticated }: NovelCommentsProps) => {
  const [comments, setComments] = useState<NovelComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  const transformDatabaseComment = useCallback((comment: SupabaseComment): NovelComment => {
    return {
      id: comment.id,
      content: comment.content,
      created_at: comment.created_at,
      profile_id: comment.profile_id,
      novel_id: novelId,
      profile: comment.profile
    };
  }, [novelId]);

  const fetchComments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('novel_comments')
        .select(`
          *,
          profile:profiles (
            username
          )
        `)
        .eq('novel_id', novelId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Raw data from Supabase:', data);
      setComments(data.map(transformDatabaseComment));
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  }, [novelId, transformDatabaseComment]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please sign in to comment');
      return;
    }

    if (!newComment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { data, error } = await supabase
        .from('novel_comments')
        .insert({
          id: crypto.randomUUID(),
          novel_id: novelId,
          content: newComment.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          profile_id: user.id
        })
        .select(`
          *,
          profile:profiles (
            username
          )
        `)
        .single();

      if (error) throw error;
      
      const transformedComment = transformDatabaseComment(data);
      setComments([transformedComment, ...comments]);
      setNewComment('');
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentUserId) return;

    try {
      const { error } = await supabase
        .from('novel_comments')
        .delete()
        .eq('id', commentId)
        .eq('profile_id', currentUserId);

      if (error) throw error;

      setComments(comments.filter(comment => comment.id !== commentId));
      toast.success('Comment deleted successfully');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const handleEditComment = async (commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
      setEditingCommentId(commentId);
      setEditedContent(comment.content);
    }
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!currentUserId || !editedContent.trim()) return;

    try {
      const { error } = await supabase
        .from('novel_comments')
        .update({
          content: editedContent.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .eq('profile_id', currentUserId);

      if (error) throw error;

      setComments(comments.map(comment => 
        comment.id === commentId 
          ? { ...comment, content: editedContent.trim() }
          : comment
      ));
      setEditingCommentId(null);
      setEditedContent('');
      toast.success('Comment updated successfully');
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Failed to update comment');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Icon icon="mdi:loading" className="animate-spin text-3xl text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Comment Form */}
      <form onSubmit={handleSubmitComment} className="space-y-4">
        <div>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={isAuthenticated ? "Write a comment..." : "Please sign in to comment"}
            disabled={!isAuthenticated || isSubmitting}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
            rows={3}
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!isAuthenticated || isSubmitting || !newComment.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Icon icon="mdi:loading" className="animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Icon icon="mdi:send" />
                Post Comment
              </>
            )}
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Icon icon="mdi:comment-text-outline" className="mx-auto text-4xl mb-2" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-white p-4 rounded-lg border">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <Icon icon="mdi:account" className="text-2xl text-gray-500" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {comment.profile.username || 'Anonymous'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatRelativeDate(comment.created_at)}
                      </span>
                    </div>
                    {currentUserId === comment.profile_id && (
                      <div className="flex gap-2">
                        {editingCommentId === comment.id ? (
                          <button
                            onClick={() => handleSaveEdit(comment.id)}
                            className="text-green-600 hover:text-green-700"
                            title="Save"
                          >
                            <Icon icon="mdi:check" className="text-xl" />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditComment(comment.id)}
                              className="text-blue-600 hover:text-blue-700"
                              title="Edit"
                            >
                              <Icon icon="mdi:pencil" className="text-xl" />
                            </button>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-red-600 hover:text-red-700"
                              title="Delete"
                            >
                              <Icon icon="mdi:delete" className="text-xl" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  {editingCommentId === comment.id ? (
                    <textarea
                      aria-label="Edit comment"
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="w-full mt-2 p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      rows={3}
                    />
                  ) : (
                    <p className="mt-1 text-gray-700 whitespace-pre-wrap break-words">
                      {comment.content}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}; 