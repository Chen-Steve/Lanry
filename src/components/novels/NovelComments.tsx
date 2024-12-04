import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { formatRelativeDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface NovelComment {
  id: string;
  content: string;
  created_at: string;
  profile_id: string;
  profile: {
    username: string | null;
  };
}

interface NovelCommentsProps {
  novelId: string;
  isAuthenticated: boolean;
}

interface DatabaseNovelComment {
  id: string;
  content: string;
  created_at: string;
  profile_id: string;
  profiles: {
    username: string | null;
  }[];
}

export const NovelComments = ({ novelId, isAuthenticated }: NovelCommentsProps) => {
  const [comments, setComments] = useState<NovelComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/novels/comments/${novelId}`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      const data = await response.json();
      setComments(data.map(transformDatabaseComment));
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
      username: comment.profiles[0]?.username ?? null
    }
  });

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
      const response = await fetch(`/api/novels/comments/${novelId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (!response.ok) throw new Error('Failed to add comment');
      
      const commentData = await response.json();
      const transformedComment = transformDatabaseComment(commentData);
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
                    <Icon icon="mdi:account" className="text-2xl text-gray-500" />
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