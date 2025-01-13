import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import supabase from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

interface ChapterComment {
  id: string;
  content: string;
  createdAt: string;
  profile: {
    id: string;
    username: string;
    avatar_url?: string;
    role: 'USER' | 'AUTHOR' | 'TRANSLATOR' | 'ADMIN' | 'SUPER_ADMIN';
  };
}

interface SupabaseComment {
  id: string;
  content: string;
  created_at: string;
  profile: {
    id: string;
    username: string;
    avatar_url: string | null;
    role: 'USER' | 'AUTHOR' | 'TRANSLATOR' | 'ADMIN' | 'SUPER_ADMIN';
  };
}

interface ChapterCommentsProps {
  novelId: string;
  chapterId: string;
  authorId: string;
}

export function ChapterComments({ novelId, chapterId, authorId }: ChapterCommentsProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comments, setComments] = useState<ChapterComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Auth setup
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted && session?.user) {
          setUserId(session.user.id);
        }
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      setUserId(session?.user?.id ?? null);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const { data, error } = await supabase
          .from('chapter_thread_comments')
          .select(`
            id,
            content,
            created_at,
            profile:profiles (
              id,
              username,
              avatar_url,
              role
            )
          `)
          .eq('chapter_id', chapterId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        const typedData = (data as unknown) as SupabaseComment[];
        setComments(typedData.map(comment => ({
          id: comment.id,
          content: comment.content,
          createdAt: comment.created_at,
          profile: {
            id: comment.profile.id,
            username: comment.profile.username,
            avatar_url: comment.profile.avatar_url ?? undefined,
            role: comment.profile.role
          }
        })));
      } catch (err) {
        console.error('Error fetching comments:', err);
        toast.error('Failed to load comments');
      } finally {
        setIsFetching(false);
      }
    };

    fetchComments();
  }, [chapterId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error('Please sign in to comment');
      return;
    }
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('chapter_thread_comments')
        .insert({
          id: uuidv4(),
          chapter_id: chapterId,
          novel_id: novelId,
          content: newComment.trim(),
          profile_id: userId,
          created_at: now,
          updated_at: now
        })
        .select(`
          id,
          content,
          created_at,
          profile:profiles (
            id,
            username,
            avatar_url,
            role
          )
        `)
        .single();

      if (error) throw error;
      
      const typedData = (data as unknown) as SupabaseComment;
      const newCommentData: ChapterComment = {
        id: typedData.id,
        content: typedData.content,
        createdAt: typedData.created_at,
        profile: {
          id: typedData.profile.id,
          username: typedData.profile.username,
          avatar_url: typedData.profile.avatar_url ?? undefined,
          role: typedData.profile.role
        }
      };

      setComments(prev => [newCommentData, ...prev]);
      setNewComment('');
      toast.success('Comment posted successfully');
    } catch (err) {
      console.error('Error posting comment:', err);
      toast.error('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('chapter_thread_comments')
        .delete()
        .eq('id', commentId)
        .eq('profile_id', userId);

      if (error) throw error;
      
      setComments(prev => prev.filter(comment => comment.id !== commentId));
      toast.success('Comment deleted successfully');
    } catch (err) {
      console.error('Error deleting comment:', err);
      toast.error('Failed to delete comment');
    }
  };

  const handleEdit = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('chapter_thread_comments')
        .update({
          content: editContent.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .eq('profile_id', userId);

      if (error) throw error;
      
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, content: editContent.trim() }
          : comment
      ));
      setEditingCommentId(null);
      setEditContent('');
      toast.success('Comment updated successfully');
    } catch (err) {
      console.error('Error updating comment:', err);
      toast.error('Failed to update comment');
    }
  };

  const startEditing = (comment: ChapterComment) => {
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
            // Show initials fallback
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

  if (isLoading || isFetching) {
    return (
      <div className="flex justify-center items-center p-4">
        <Icon icon="eos-icons:loading" className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Comments</h3>
      
      {userId ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full min-h-[100px]"
          />
          <Button 
            type="submit" 
            disabled={isSubmitting || !newComment.trim()}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Icon icon="eos-icons:loading" className="w-4 h-4 animate-spin" />
                <span>Posting...</span>
              </>
            ) : (
              <>
                <Icon icon="mdi:send" className="w-4 h-4" />
                <span>Post Comment</span>
              </>
            )}
          </Button>
        </form>
      ) : (
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <p className="text-muted-foreground mb-2">Please sign in to comment</p>
          <Link 
            href="/auth" 
            className="text-primary hover:text-primary/90 transition-colors"
          >
            Sign In
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
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
                      comment.profile.role === 'SUPER_ADMIN' ? 'bg-purple-100 dark:bg-purple-900/30' :
                      'bg-gray-100 dark:bg-gray-800'
                    } text-black dark:text-gray-200`}>
                      {comment.profile.role.charAt(0) + comment.profile.role.slice(1).toLowerCase()}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <time dateTime={comment.createdAt}>
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </time>
                  {userId === comment.profile.id && (
                    <>
                      <button
                        onClick={() => startEditing(comment)}
                        className="text-blue-500 hover:text-blue-600 transition-colors"
                        title="Edit comment"
                      >
                        <Icon icon="mdi:pencil" className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="text-red-500 hover:text-red-600 transition-colors"
                        title="Delete comment"
                      >
                        <Icon icon="mdi:delete" className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {userId === authorId && userId !== comment.profile.id && (
                    <button
                      onClick={() => handleDelete(comment.id)}
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
                      onClick={() => handleEdit(comment.id)}
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
                <p className="text-sm text-muted-foreground">{comment.content}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChapterComments; 