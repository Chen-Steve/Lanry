import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import supabase from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';

interface CommentItemProps {
  comment: {
    id: string;
    content: string;
    createdAt: string;
    profile: {
      id: string;
      username: string;
      avatar_url?: string;
      role: 'USER' | 'AUTHOR' | 'TRANSLATOR' | 'ADMIN';
    };
  };
  userId: string | null;
  authorId: string;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
}

export function CommentItem({ comment, userId, authorId, onEdit, onDelete }: CommentItemProps) {
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);

  useEffect(() => {
    // Fetch initial likes count and user's like status
    const fetchLikes = async () => {
      try {
        // Get total likes count
        const { count, error: countError } = await supabase
          .from('chapter_thread_comment_likes')
          .select('*', { count: 'exact', head: true })
          .eq('comment_id', comment.id);

        if (countError) throw countError;
        setLikesCount(count || 0);

        // Check if user has liked this comment
        if (userId) {
          const { data, error: likeError } = await supabase
            .from('chapter_thread_comment_likes')
            .select('id')
            .eq('comment_id', comment.id)
            .eq('profile_id', userId)
            .single();

          if (likeError && likeError.code !== 'PGRST116') throw likeError;
          setIsLiked(!!data);
        }
      } catch (err) {
        console.error('Error fetching likes:', err);
      }
    };

    fetchLikes();
  }, [comment.id, userId]);

  const handleLikeToggle = async () => {
    if (!userId) {
      toast.error('Please sign in to like comments');
      return;
    }

    setIsLikeLoading(true);
    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('chapter_thread_comment_likes')
          .delete()
          .eq('comment_id', comment.id)
          .eq('profile_id', userId);

        if (error) throw error;
        setLikesCount(prev => Math.max(0, prev - 1));
        setIsLiked(false);
      } else {
        // Like
        const now = new Date().toISOString();
        const { error } = await supabase
          .from('chapter_thread_comment_likes')
          .insert({
            id: crypto.randomUUID(),
            comment_id: comment.id,
            profile_id: userId,
            created_at: now,
            updated_at: now
          });

        if (error) throw error;
        setLikesCount(prev => prev + 1);
        setIsLiked(true);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      toast.error('Failed to update like');
    } finally {
      setIsLikeLoading(false);
    }
  };

  const startEditing = () => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const renderAvatar = (username: string, avatarUrl?: string) => {
    if (avatarUrl) {
      return (
        <Image
          src={avatarUrl}
          alt={username}
          width={32}
          height={32}
          className="w-8 h-8 rounded-full object-cover"
          unoptimized
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = username[0]?.toUpperCase() || '?';
              parent.className = "w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium";
            }
          }}
        />
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
        {username[0]?.toUpperCase() || '?'}
      </div>
    );
  };

  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0">
        {renderAvatar(comment.profile.username, comment.profile.avatar_url)}
      </div>
      <div className="flex-grow space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">{comment.profile.username}</span>
            {comment.profile.role && comment.profile.role !== 'USER' && (
              <span className={`px-1 py-0.5 text-xs font-medium rounded inline-flex items-center flex-shrink-0 ${
                comment.profile.role === 'AUTHOR' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                comment.profile.role === 'TRANSLATOR' ? 'bg-blue-100 dark:bg-blue-900/30' :
                comment.profile.role === 'ADMIN' ? 'bg-red-100 dark:bg-red-900/30' :
                comment.profile.role === '' ? 'bg-purple-100 dark:bg-purple-900/30' :
                'bg-gray-100 dark:bg-gray-800'
              } text-black dark:text-gray-200`}>
                {comment.profile.role.charAt(0) + comment.profile.role.slice(1).toLowerCase()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <time dateTime={comment.createdAt} className="text-muted-foreground">
              {new Date(comment.createdAt).toLocaleDateString()}
            </time>
            <button
              onClick={handleLikeToggle}
              disabled={isLikeLoading}
              className={`flex items-center gap-1 transition-colors ${
                isLiked 
                  ? 'text-red-500 hover:text-red-600' 
                  : 'text-muted-foreground hover:text-red-500'
              }`}
              title={isLiked ? 'Unlike' : 'Like'}
            >
              <Icon 
                icon={isLiked ? "mdi:heart" : "mdi:heart-outline"} 
                className={`w-4 h-4 ${isLikeLoading ? 'animate-pulse' : ''}`} 
              />
              <span>{likesCount}</span>
            </button>
            {userId === comment.profile.id && (
              <>
                <button
                  onClick={startEditing}
                  className="text-blue-500 hover:text-blue-600 transition-colors"
                  title="Edit comment"
                >
                  <Icon icon="mdi:pencil" className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(comment.id)}
                  className="text-red-500 hover:text-red-600 transition-colors"
                  title="Delete comment"
                >
                  <Icon icon="mdi:delete" className="w-4 h-4" />
                </button>
              </>
            )}
            {userId === authorId && userId !== comment.profile.id && (
              <button
                onClick={() => onDelete(comment.id)}
                className="text-red-500 hover:text-red-600 transition-colors"
                title="Delete comment"
              >
                <Icon icon="mdi:delete" className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        {editingCommentId === comment.id ? (
          <div className="space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full min-h-[100px]"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  onEdit(comment.id, editContent);
                  setEditingCommentId(null);
                }}
                disabled={!editContent.trim() || editContent.trim() === comment.content}
                className="text-sm"
              >
                Save
              </Button>
              <Button
                onClick={() => {
                  setEditingCommentId(null);
                  setEditContent('');
                }}
                variant="outline"
                className="text-sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{comment.content}</p>
          </div>
        )}
      </div>
    </div>
  );
} 