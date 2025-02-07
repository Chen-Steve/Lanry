import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import supabase from '@/lib/supabaseClient';
import { formatRelativeDate, generateUUID } from '@/lib/utils';
import type { NovelComment } from '@/types/database';
import { CommentReplies } from './CommentReplies';

interface CommentItemProps {
  comment: NovelComment & {
    profile: {
      username: string | null;
      avatar_url?: string;
      role: 'USER' | 'AUTHOR' | 'TRANSLATOR' | 'ADMIN' | 'SUPER_ADMIN';
    };
    likeCount: number;
    isLiked?: boolean;
  };
  currentUserId: string | null;
  editingCommentId: string | null;
  editedContent: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onSave: (id: string) => void;
  setEditedContent: (content: string) => void;
}

export const CommentItem = ({
  comment,
  currentUserId,
  editingCommentId,
  editedContent,
  onEdit,
  onDelete,
  onSave,
  setEditedContent,
  isAuthenticated
}: CommentItemProps & { isAuthenticated: boolean }) => {
  const isEditing = editingCommentId === comment.id;
  const isOwnComment = currentUserId === comment.profile_id;
  const [isLiked, setIsLiked] = useState(comment.isLiked);
  const [likeCount, setLikeCount] = useState(comment.likeCount);
  const [isLiking, setIsLiking] = useState(false);
  const [isRepliesExpanded, setIsRepliesExpanded] = useState(false);
  const [replyCount, setReplyCount] = useState(0);

  // Fetch reply count when component mounts
  useEffect(() => {
    const fetchReplyCount = async () => {
      try {
        const { count, error } = await supabase
          .from('novel_comments')
          .select('id', { count: 'exact' })
          .eq('parent_comment_id', comment.id);

        if (error) throw error;
        setReplyCount(count || 0);
      } catch (error) {
        console.error('Error fetching reply count:', error);
      }
    };

    fetchReplyCount();
  }, [comment.id]);

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

  const handleReplyAdded = () => {
    setReplyCount(prev => prev + 1);
  };

  return (
    <div className="space-y-2">
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
                  className="h-8 px-3 text-sm flex items-center gap-1.5"
                >
                  <Icon icon="mdi:check" className="text-lg" />
                  Save
                </Button>
                <Button
                  onClick={() => {
                    setEditedContent('');
                    onEdit('');
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
              <div className="flex items-center gap-4 mt-2">
                {/* Comment Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsRepliesExpanded(!isRepliesExpanded)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    <Icon 
                      icon={isRepliesExpanded ? "mdi:chevron-down" : "mdi:chevron-right"} 
                      className="text-lg"
                    />
                    {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                  </button>
                  <button
                    onClick={() => setIsRepliesExpanded(true)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    <Icon icon="mdi:reply" className="text-lg" />
                    Reply
                  </button>
                </div>
                {/* Edit/Delete Actions */}
                {isOwnComment && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit(comment.id)}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                      aria-label="Edit comment"
                    >
                      <Icon icon="mdi:pencil" className="text-lg" />
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(comment.id)}
                      className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors flex items-center gap-1"
                      aria-label="Delete comment"
                    >
                      <Icon icon="mdi:delete" className="text-lg" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Replies section */}
      <CommentReplies
        parentCommentId={comment.id}
        isAuthenticated={isAuthenticated}
        isExpanded={isRepliesExpanded}
        novelId={comment.novel_id}
        onReplyAdded={handleReplyAdded}
        currentUserId={currentUserId}
      />
    </div>
  );
}; 