import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from 'sonner';
import supabase from '@/lib/supabaseClient';
import { formatRelativeDate, generateUUID } from '@/lib/utils';
import type { NovelComment } from '@/types/database';
import { notificationService } from '@/services/notificationService';

interface ReplyData {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profile_id: string;
  parent_comment_id: string;
  novel_id: string;
  like_count: number;
  isLiked?: boolean;
  profile: {
    username: string | null;
    avatar_url?: string;
    role: 'USER' | 'AUTHOR' | 'TRANSLATOR';
  };
}

interface CommentReply extends NovelComment {
  parent_comment_id: string;
  isLiked?: boolean;
  like_count: number;
  profile: {
    username: string | null;
    avatar_url?: string;
    role: 'USER' | 'AUTHOR' | 'TRANSLATOR';
  };
}

interface CommentRepliesProps {
  parentCommentId: string;
  isAuthenticated: boolean;
  isExpanded: boolean;
  novelId: string;
  novelSlug: string;
  onReplyAdded?: () => void;
  currentUserId: string | null;
}

export const CommentReplies = ({ 
  parentCommentId, 
  isAuthenticated,
  isExpanded,
  novelId,
  novelSlug,
  onReplyAdded,
  currentUserId
}: CommentRepliesProps) => {
  const [replies, setReplies] = useState<CommentReply[]>([]);
  const [newReply, setNewReply] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [likingReplyId, setLikingReplyId] = useState<string | null>(null);

  const fetchReplies = useCallback(async () => {
    if (!isExpanded) return;
    
    try {
      // First fetch the replies
      const { data, error } = await supabase
        .from('novel_comments')
        .select(`
          id,
          content,
          created_at,
          updated_at,
          profile_id,
          parent_comment_id,
          novel_id,
          like_count,
          profile:profiles!inner (
            username,
            avatar_url,
            role
          )
        `)
        .eq('parent_comment_id', parentCommentId)
        .order('created_at', { ascending: true })
        .returns<ReplyData[]>();

      if (error) throw error;

      // If user is authenticated, fetch their likes
      let userLikes: { comment_id: string }[] = [];
      if (currentUserId) {
        const { data: likesData } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('profile_id', currentUserId)
          .in('comment_id', data.map(reply => reply.id));
        
        userLikes = likesData || [];
      }

      // Transform the data and add isLiked property
      const transformedReplies = data.map(reply => ({
        ...reply,
        isLiked: userLikes.some(like => like.comment_id === reply.id),
        profile: {
          username: reply.profile.username,
          avatar_url: reply.profile.avatar_url,
          role: reply.profile.role
        }
      }));

      setReplies(transformedReplies);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching replies:', error);
      toast.error('Failed to load replies');
      setIsLoading(false);
    }
  }, [isExpanded, parentCommentId, currentUserId]);

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please sign in to reply');
      return;
    }

    if (!newReply.trim()) {
      toast.error('Reply cannot be empty');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      // First get the user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url, role')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Get the parent comment's author
      const { data: parentComment } = await supabase
        .from('novel_comments')
        .select('profile_id')
        .eq('id', parentCommentId)
        .single();

      if (!parentComment) throw new Error('Parent comment not found');

      // Create the reply
      const { data: reply, error } = await supabase
        .from('novel_comments')
        .insert({
          id: generateUUID(),
          content: newReply.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          profile_id: user.id,
          parent_comment_id: parentCommentId,
          novel_id: novelId
        })
        .select()
        .single();

      if (error) throw error;

      // Add profile info to the reply
      const newReplyWithProfile = {
        ...reply,
        profile: {
          username: profile.username,
          avatar_url: profile.avatar_url,
          role: profile.role
        }
      };
      
      // Create notification for the parent comment author
      if (parentComment.profile_id !== user.id) {
        await notificationService.createNotification({
          recipientId: parentComment.profile_id,
          senderId: user.id,
          type: 'comment_reply',
          content: `${profile.username} replied to your comment: "${newReply.trim().substring(0, 50)}${newReply.length > 50 ? '...' : ''}"`,
          link: `/novels/${novelSlug}?tab=comments`,
          novelId,
          commentId: parentCommentId
        });
      }
      
      setReplies([...replies, newReplyWithProfile]);
      setNewReply('');
      onReplyAdded?.();
      toast.success('Reply added successfully');
    } catch (error) {
      console.error('Error adding reply:', error);
      toast.error('Failed to add reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditReply = (replyId: string) => {
    const reply = replies.find(r => r.id === replyId);
    if (reply) {
      setEditingReplyId(replyId);
      setEditedContent(reply.content);
    }
  };

  const handleSaveEdit = async (replyId: string) => {
    if (!currentUserId || !editedContent.trim()) return;

    try {
      const { error } = await supabase
        .from('novel_comments')
        .update({
          content: editedContent.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', replyId)
        .eq('profile_id', currentUserId);

      if (error) throw error;

      setReplies(replies.map(reply => 
        reply.id === replyId 
          ? { ...reply, content: editedContent.trim() }
          : reply
      ));
      setEditingReplyId(null);
      setEditedContent('');
      toast.success('Reply updated successfully');
    } catch (error) {
      console.error('Error updating reply:', error);
      toast.error('Failed to update reply');
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!currentUserId) return;

    try {
      const { error } = await supabase
        .from('novel_comments')
        .delete()
        .eq('id', replyId)
        .eq('profile_id', currentUserId);

      if (error) throw error;

      setReplies(replies.filter(reply => reply.id !== replyId));
      onReplyAdded?.();
      toast.success('Reply deleted successfully');
    } catch (error) {
      console.error('Error deleting reply:', error);
      toast.error('Failed to delete reply');
    }
  };

  const handleLikeReply = async (replyId: string) => {
    if (!currentUserId) {
      toast.error('Please sign in to like replies');
      return;
    }

    if (likingReplyId === replyId) return;

    setLikingReplyId(replyId);
    const reply = replies.find(r => r.id === replyId);
    if (!reply) return;

    try {
      if (!reply.isLiked) {
        const { error: insertError } = await supabase
          .from('comment_likes')
          .insert({
            id: generateUUID(),
            comment_id: replyId,
            profile_id: currentUserId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) throw insertError;

        const { error: updateError } = await supabase
          .from('novel_comments')
          .update({ like_count: (reply.like_count || 0) + 1 })
          .eq('id', replyId);

        if (updateError) throw updateError;

        // Create notification for the reply author if it's not their own reply
        if (reply.profile_id !== currentUserId) {
          const { data: currentUser } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', currentUserId)
            .single();

          await notificationService.createNotification({
            recipientId: reply.profile_id,
            senderId: currentUserId,
            type: 'like',
            content: `${currentUser?.username || 'Someone'} liked your reply: "${reply.content.substring(0, 50)}${reply.content.length > 50 ? '...' : ''}"`,
            link: `/novels/${novelSlug}?tab=comments`,
            novelId,
            commentId: reply.id
          });
        }

        setReplies(prevReplies => 
          prevReplies.map(r => 
            r.id === replyId 
              ? { ...r, isLiked: true, like_count: (r.like_count || 0) + 1 }
              : r
          )
        );
      } else {
        const { error: deleteError } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', replyId)
          .eq('profile_id', currentUserId);

        if (deleteError) throw deleteError;

        const { error: updateError } = await supabase
          .from('novel_comments')
          .update({ like_count: Math.max((reply.like_count || 0) - 1, 0) })
          .eq('id', replyId);

        if (updateError) throw updateError;

        setReplies(prevReplies => 
          prevReplies.map(r => 
            r.id === replyId 
              ? { ...r, isLiked: false, like_count: Math.max((r.like_count || 0) - 1, 0) }
              : r
          )
        );
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    } finally {
      setLikingReplyId(null);
    }
  };

  // Fetch replies when expanded
  useEffect(() => {
    if (isExpanded) {
      setIsLoading(true);
      fetchReplies();
    }
  }, [isExpanded, fetchReplies]);

  if (!isExpanded) return null;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-4">
        <Icon icon="mdi:loading" className="animate-spin text-2xl text-primary" />
      </div>
    );
  }

  return (
    <div className="pl-12 space-y-4 mt-2">
      {/* Reply Form */}
      <form onSubmit={handleSubmitReply} className="space-y-2">
        <textarea
          value={newReply}
          onChange={(e) => setNewReply(e.target.value)}
          placeholder={isAuthenticated ? "Write a reply..." : "Please sign in to reply"}
          disabled={!isAuthenticated || isSubmitting}
          className="w-full p-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-muted disabled:text-muted-foreground"
          rows={2}
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!isAuthenticated || isSubmitting || !newReply.trim()}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Icon icon="mdi:loading" className="animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Icon icon="mdi:reply" />
                Post Reply
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Replies List */}
      <div className="space-y-3">
        {replies.map(reply => {
          const isOwnReply = currentUserId === reply.profile_id;
          const isEditing = editingReplyId === reply.id;

          return (
            <div key={reply.id} className="flex gap-2">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-primary">
                {reply.profile.avatar_url ? (
                  <img
                    src={reply.profile.avatar_url}
                    alt={reply.profile.username || 'User avatar'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = reply.profile.username?.[0]?.toUpperCase() || 'U';
                        parent.className = "w-full h-full rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm sm:text-base";
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary-foreground font-semibold text-sm sm:text-base">
                    {reply.profile.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2">
                  <Link 
                    href={`/user-dashboard?id=${reply.profile_id}`}
                    className="font-medium text-foreground hover:text-primary transition-colors text-sm"
                  >
                    {reply.profile.username || 'Anonymous'}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeDate(reply.created_at)}
                  </span>
                </div>
                {isEditing ? (
                  <div className="space-y-2 mt-2">
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="w-full p-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                      rows={2}
                      placeholder="Edit your reply..."
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={() => handleSaveEdit(reply.id)}
                        disabled={!editedContent.trim()}
                        variant="default"
                        className="h-8 px-3 text-sm flex items-center gap-1.5"
                      >
                        <Icon icon="mdi:check" className="text-lg" />
                        Save
                      </Button>
                      <Button
                        onClick={() => {
                          setEditingReplyId(null);
                          setEditedContent('');
                        }}
                        variant="outline"
                        className="h-8 px-3 text-sm flex items-center gap-1.5"
                      >
                        <Icon icon="mdi:close" className="text-lg" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                        {reply.content}
                      </p>
                      <button
                        onClick={() => handleLikeReply(reply.id)}
                        disabled={likingReplyId === reply.id}
                        className={`flex items-center gap-1 text-sm transition-colors flex-shrink-0 p-1 -m-1 rounded-full hover:bg-accent ${
                          reply.isLiked 
                            ? 'text-primary hover:text-primary/80' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                        aria-label={reply.isLiked ? 'Unlike reply' : 'Like reply'}
                      >
                        <Icon 
                          icon={reply.isLiked ? 'mdi:heart' : 'mdi:heart-outline'} 
                          className={`text-lg ${likingReplyId === reply.id ? 'animate-pulse' : ''}`}
                        />
                        <span>{reply.like_count || 0}</span>
                      </button>
                    </div>
                    {isOwnReply && (
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() => handleEditReply(reply.id)}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                        >
                          <Icon icon="mdi:pencil" className="text-sm" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteReply(reply.id)}
                          className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors flex items-center gap-1"
                        >
                          <Icon icon="mdi:delete" className="text-sm" />
                          Delete
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}; 