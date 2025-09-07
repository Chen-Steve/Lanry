import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { generateUUID } from '@/lib/utils';
import { toast } from 'sonner';
import supabase from '@/lib/supabaseClient';
import type { NovelComment as BaseNovelComment } from '@/types/database';
import { Button } from '@/components/ui/button';
import { CommentItem } from './CommentItem';
import { useSupabase } from '@/app/providers';

interface NovelComment extends Omit<BaseNovelComment, 'profile'> {
  profile: {
    username: string | null;
    avatar_url?: string;
    role: 'USER' | 'AUTHOR' | 'TRANSLATOR';
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
    role: 'USER' | 'AUTHOR' | 'TRANSLATOR';
  };
}

interface NovelCommentsProps {
  novelId: string;
  novelSlug: string;
  isAuthenticated: boolean;
}

export const NovelComments = ({ novelId, novelSlug, isAuthenticated }: NovelCommentsProps) => {
  const [comments, setComments] = useState<NovelComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { user } = useSupabase();

  useEffect(() => {
    setCurrentUserId(user?.id ?? null);
  }, [user]);

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
        .is('parent_comment_id', null)
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
  }, [novelId, transformDatabaseComment, user]);

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
      if (!user) throw new Error('User not found');

      const { data, error } = await supabase
        .from('novel_comments')
        .insert({
          id: generateUUID(),
          novel_id: novelId,
          content: newComment.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          profile_id: user.id,
          parent_comment_id: null
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
          className="w-full p-3 border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-muted disabled:text-muted-foreground"
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
              isAuthenticated={isAuthenticated}
              novelSlug={novelSlug}
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