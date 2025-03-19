import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import supabase from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { CommentItem } from './CommentItem';

interface ChapterComment {
  id: string;
  content: string;
  createdAt: string;
  profile: {
    id: string;
    username: string;
    avatar_url?: string;
    role: 'USER' | 'AUTHOR' | 'TRANSLATOR' | 'ADMIN';
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
    role: 'USER' | 'AUTHOR' | 'TRANSLATOR' | 'ADMIN';
  };
}

interface ChapterCommentsProps {
  chapterId: string;
  authorId: string;
}

export function ChapterComments({ chapterId, authorId }: ChapterCommentsProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comments, setComments] = useState<ChapterComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

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

  const handleEdit = async (commentId: string, content: string) => {
    try {
      const { error } = await supabase
        .from('chapter_thread_comments')
        .update({
          content: content.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .eq('profile_id', userId);

      if (error) throw error;
      
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, content: content.trim() }
          : comment
      ));
      toast.success('Comment updated successfully');
    } catch (err) {
      console.error('Error updating comment:', err);
      toast.error('Failed to update comment');
    }
  };

  if (isLoading || isFetching) {
    return (
      <div className="flex justify-center items-center p-4">
        <Icon icon="eos-icons:loading" className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
        <div className="flex items-center gap-3">
          <Icon 
            icon="ph:warning-circle-bold" 
            className="w-6 h-6 text-yellow-500 flex-shrink-0"
          />
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            Please do not share the website&apos;s link anywhere except for NovelUpdates.
          </p>
        </div>
      </div>

      <h3 className="text-lg font-semibold">Comments</h3>
      
      {userId ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full min-h-[100px] dark:text-black"
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
          <CommentItem
            key={comment.id}
            comment={comment}
            userId={userId}
            authorId={authorId}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}

export default ChapterComments; 