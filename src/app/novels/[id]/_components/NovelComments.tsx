import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { formatRelativeDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import supabase from '@/lib/supabaseClient';
import type { NovelComment as BaseNovelComment } from '@/types/database';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

// Extend the base type to include avatar_url
interface NovelComment extends Omit<BaseNovelComment, 'profile'> {
  profile: {
    username: string | null;
    avatar_url?: string;
  };
}

interface SupabaseComment {
  id: string;
  content: string;
  created_at: string;
  profile_id: string;
  novel_id: string;
  updated_at: string;
  profile: {
    username: string | null;
    avatar_url?: string;
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
            username,
            avatar_url
          )
        `)
        .eq('novel_id', novelId)
        .order('created_at', { ascending: false });

      if (error) throw error;
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
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={isAuthenticated ? "Write a comment..." : "Please sign in to comment"}
          disabled={!isAuthenticated || isSubmitting}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-50"
          rows={3}
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!isAuthenticated || isSubmitting || !newComment.trim()}
            className="flex items-center gap-2"
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
          </Button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <EmptyComments />
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              editingCommentId={editingCommentId}
              editedContent={editedContent}
              onEdit={handleEditComment}
              onDelete={handleDeleteComment}
              onSave={handleSaveEdit}
              setEditedContent={setEditedContent}
            />
          ))
        )}
      </div>
    </div>
  );
};

const EmptyComments = () => (
  <div className="text-center py-8 text-gray-500">
    <Icon icon="mdi:comment-text-outline" className="mx-auto text-4xl mb-2" />
    <p>No comments yet. Be the first to comment!</p>
  </div>
);

interface CommentItemProps {
  comment: NovelComment;
  currentUserId: string | null;
  editingCommentId: string | null;
  editedContent: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onSave: (id: string) => void;
  setEditedContent: (content: string) => void;
}

const CommentItem = ({
  comment,
  currentUserId,
  editingCommentId,
  editedContent,
  onEdit,
  onDelete,
  onSave,
  setEditedContent
}: CommentItemProps) => {
  const isEditing = editingCommentId === comment.id;
  const isOwnComment = currentUserId === comment.profile_id;

  return (
    <div className="flex gap-3 p-4 bg-white rounded-lg shadow-sm">
      {/* Avatar */}
      <Link href={`/user-dashboard?id=${comment.profile_id}`} className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-500">
          {comment.profile.avatar_url ? (
            <Image
              src={comment.profile.avatar_url}
              alt={comment.profile.username || 'User avatar'}
              width={40}
              height={40}
              className="w-full h-full object-cover"
              unoptimized
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                // Show initials fallback
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = comment.profile.username?.[0]?.toUpperCase() || '?';
                  parent.className = "w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold";
                }
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-sm font-semibold">
              {comment.profile.username?.[0]?.toUpperCase() || '?'}
            </div>
          )}
        </div>
      </Link>

      <div className="flex-grow min-w-0">
        <div className="flex items-start justify-between gap-x-2">
          <div>
            <Link 
              href={`/user-dashboard?id=${comment.profile_id}`}
              className="font-medium text-gray-900 hover:text-gray-600 transition-colors"
            >
              {comment.profile.username || 'Unknown User'}
            </Link>
            <span className="mx-2 text-gray-300">•</span>
            <span className="text-sm text-gray-500">
              {formatRelativeDate(comment.created_at)}
            </span>
          </div>
          {isOwnComment && !isEditing && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit(comment.id)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Edit comment"
              >
                <Icon icon="mdi:pencil" className="text-lg" />
              </button>
              <button
                onClick={() => onDelete(comment.id)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                title="Delete comment"
              >
                <Icon icon="mdi:delete" className="text-lg" />
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="mt-2 space-y-2">
            <textarea
              placeholder="Edit your comment..."
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full p-2 border rounded-md"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => onSave(comment.id)}
                className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditedContent('');
                  onEdit('');
                }}
                className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-1 text-gray-600 whitespace-pre-wrap break-words">
            {comment.content}
          </p>
        )}
      </div>
    </div>
  );
}; 