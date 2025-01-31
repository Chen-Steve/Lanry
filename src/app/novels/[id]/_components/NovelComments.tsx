import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { formatRelativeDate, generateUUID } from '@/lib/utils';
import toast from 'react-hot-toast';
import supabase from '@/lib/supabaseClient';
import type { NovelComment as BaseNovelComment } from '@/types/database';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

interface NovelComment extends Omit<BaseNovelComment, 'profile'> {
  profile: {
    username: string | null;
    avatar_url?: string;
    role: 'USER' | 'AUTHOR' | 'TRANSLATOR' | 'ADMIN' | 'SUPER_ADMIN';
  };
  likeCount: number;
  isLiked?: boolean;
}

interface SupabaseComment {
  id: string;
  content: string;
  created_at: string;
  profile_id: string;
  novel_id: string;
  updated_at: string;
  like_count: number;
  profile: {
    id: string;
    username: string | null;
    avatar_url?: string;
    role: 'USER' | 'AUTHOR' | 'TRANSLATOR' | 'ADMIN' | 'SUPER_ADMIN';
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
      profile: comment.profile,
      likeCount: comment.like_count || 0
    };
  }, [novelId]);

  const fetchComments = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('novel_comments')
        .select(`
          *,
          profile:profiles (
            username,
            avatar_url,
            id,
            role
          )
        `)
        .eq('novel_id', novelId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (user) {
        // Fetch likes for the current user
        const { data: likes } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('profile_id', user.id)
          .in('comment_id', data.map(comment => comment.id));

        const likedCommentIds = new Set(likes?.map(like => like.comment_id) || []);
        
        setComments(data.map(comment => ({
          ...transformDatabaseComment(comment),
          isLiked: likedCommentIds.has(comment.id)
        })));
      } else {
        setComments(data.map(transformDatabaseComment));
      }
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
          id: generateUUID(),
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
        <Icon icon="mdi:loading" className="animate-spin text-3xl text-primary" />
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
          className="w-full p-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-muted disabled:text-muted-foreground"
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
          comments.map(comment => (
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
  <div className="text-center py-8">
    <Icon icon="mdi:comment-outline" className="mx-auto text-4xl text-muted-foreground mb-2" />
    <p className="text-muted-foreground">No comments yet. Be the first to share your thoughts!</p>
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
  const [isLiked, setIsLiked] = useState(comment.isLiked);
  const [likeCount, setLikeCount] = useState(comment.likeCount);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (!currentUserId) {
      toast.error('Please sign in to like comments');
      return;
    }

    if (isLiking) return;

    setIsLiking(true);
    try {
      if (!isLiked) {
        const { error: insertError } = await supabase
          .from('comment_likes')
          .insert({
            id: generateUUID(),
            comment_id: comment.id,
            profile_id: currentUserId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) throw insertError;

        const { error: updateError } = await supabase
          .from('novel_comments')
          .update({ like_count: likeCount + 1 })
          .eq('id', comment.id);

        if (updateError) throw updateError;

        setIsLiked(true);
        setLikeCount(prev => prev + 1);
      } else {
        const { error: deleteError } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', comment.id)
          .eq('profile_id', currentUserId);

        if (deleteError) throw deleteError;

        const { error: updateError } = await supabase
          .from('novel_comments')
          .update({ like_count: likeCount - 1 })
          .eq('id', comment.id);

        if (updateError) throw updateError;

        setIsLiked(false);
        setLikeCount(prev => prev - 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div className="flex gap-3 p-4 rounded-lg bg-card border border-border">
      <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-primary">
        {comment.profile.avatar_url ? (
          <Image
            src={comment.profile.avatar_url}
            alt={comment.profile.username || 'User avatar'}
            width={40}
            height={40}
            unoptimized
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              // Show initials fallback
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = comment.profile.username?.[0]?.toUpperCase() || 'U';
                parent.className = "w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold";
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-primary-foreground font-semibold">
            {comment.profile.username?.[0]?.toUpperCase() || 'U'}
          </div>
        )}
      </div>
      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Link 
            href={`/user-dashboard?id=${comment.profile_id}`}
            className="font-medium text-foreground hover:text-primary transition-colors mb-0 sm:mb-1"
          >
            {comment.profile.username || 'Anonymous'}
          </Link>
          <span className="text-xs text-muted-foreground">
            {formatRelativeDate(comment.created_at)}
          </span>
          {isOwnComment && !isEditing && (
            <div className="ml-auto flex gap-2">
              <button
                onClick={() => onEdit(comment.id)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Edit comment"
              >
                <Icon icon="mdi:pencil" className="text-lg" />
              </button>
              <button
                onClick={() => onDelete(comment.id)}
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                aria-label="Delete comment"
              >
                <Icon icon="mdi:delete" className="text-lg" />
              </button>
            </div>
          )}
        </div>
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full p-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
              rows={3}
              aria-label="Edit comment"
              placeholder="Edit your comment..."
            />
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => onSave(comment.id)}
                disabled={!editedContent.trim()}
                variant="default"
              >
                Save
              </Button>
              <Button
                onClick={() => {
                  setEditedContent('');
                  onEdit('');
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start gap-2">
              <p className="text-foreground whitespace-pre-wrap break-words">{comment.content}</p>
              <button
                onClick={handleLike}
                disabled={isLiking}
                className={`flex items-center gap-1 text-sm transition-colors flex-shrink-0 ${
                  isLiked 
                    ? 'text-primary hover:text-primary/80' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-label={isLiked ? 'Unlike comment' : 'Like comment'}
              >
                <Icon 
                  icon={isLiked ? 'mdi:heart' : 'mdi:heart-outline'} 
                  className={`text-lg ${isLiking ? 'animate-pulse' : ''}`}
                />
                <span>{likeCount}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};