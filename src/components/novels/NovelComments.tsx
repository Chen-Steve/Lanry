import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import Image from 'next/image';
import supabase from '@/lib/supabaseClient';
import { UserProfile } from '@/types/database';
import { formatRelativeDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface NovelComment {
  id: string;
  content: string;
  created_at: string;
  profile_id: string;
  profile: {
    username: string | null;
    avatar_url: string | null;
  };
}

interface NovelCommentsProps {
  novelId: string;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
}

interface DatabaseNovelComment {
  id: string;
  content: string;
  created_at: string;
  profile_id: string;
  profiles: {
    username: string | null;
    avatar_url: string | null;
  }[];
}

export const NovelComments = ({ novelId, userProfile, isAuthenticated }: NovelCommentsProps) => {
  const [comments, setComments] = useState<NovelComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('novel_comments')
        .select(`
          id,
          content,
          created_at,
          profile_id,
          profiles (
            username,
            avatar_url
          )
        `)
        .eq('novel_id', novelId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const transformedComments = (data as DatabaseNovelComment[]).map(transformDatabaseComment);
      setComments(transformedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  }, [novelId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const transformDatabaseComment = (comment: DatabaseNovelComment): NovelComment => ({
    id: comment.id,
    content: comment.content,
    created_at: comment.created_at,
    profile_id: comment.profile_id,
    profile: {
      username: comment.profiles[0]?.username ?? null,
      avatar_url: comment.profiles[0]?.avatar_url ?? null
    }
  });

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please sign in to comment', {
        duration: 3000,
        position: 'bottom-center',
      });
      return;
    }

    if (!newComment.trim()) {
      toast.error('Comment cannot be empty', {
        duration: 3000,
        position: 'bottom-center',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: commentData, error: commentError } = await supabase
        .from('novel_comments')
        .insert([
          {
            novel_id: novelId,
            profile_id: userProfile?.id,
            content: newComment.trim(),
          },
        ])
        .select(`
          id,
          content,
          created_at,
          profile_id,
          profiles (
            username,
            avatar_url
          )
        `)
        .single();

      if (commentError) throw commentError;

      const transformedComment = transformDatabaseComment(commentData as DatabaseNovelComment);
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
                    {comment.profile.avatar_url ? (
                      <Image
                        src={comment.profile.avatar_url}
                        alt={comment.profile.username || 'User'}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <Icon icon="mdi:account" className="text-2xl text-gray-500" />
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium text-gray-900">
                      {comment.profile.username || 'Anonymous'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatRelativeDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="mt-1 text-gray-700 whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}; 