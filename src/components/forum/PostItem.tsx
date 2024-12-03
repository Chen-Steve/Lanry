'use client';

import { ForumPost } from '@/types/database';
import { Icon } from '@iconify/react';
import { useUser } from '@/hooks/useUser';
import CreatePostButton from './CreatePostButton';
import VoteControls from './VoteControls';
import { formatForumDateTime } from '@/lib/utils';

interface PostItemProps {
  post: ForumPost & { isLiked?: boolean };
  onVoteUp: () => void;
  onReply: (post: ForumPost) => void;
  onDelete: (postId: string) => void;
  threadLocked: boolean;
  parentPost?: ForumPost;
}

export default function PostItem({ 
  post, 
  onVoteUp, 
  onReply, 
  onDelete,
  threadLocked, 
  parentPost 
}: PostItemProps) {
  const { user } = useUser();
  const isAuthor = user?.id === post.author_id;

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this post?')) {
      onDelete(post.id);
    }
  };

  return (
    <div className="bg-white rounded p-4 hover:border-gray-300 border border-gray-200">
      <div className="flex">
        <VoteControls 
          score={post.score || 0}
          isLiked={post.isLiked}
          onUpvote={onVoteUp}
        />
        <div className="flex-1">
          {parentPost && (
            <div className="mb-3 pl-3 border-l-2 border-gray-200">
              <div className="text-xs text-gray-500 mb-1">
                <Icon icon="mdi:reply" className="w-3 h-3 inline mr-1" />
                Replying to @{parentPost.author.username}
              </div>
              <div className="text-sm text-gray-600 line-clamp-2">
                {parentPost.content}
              </div>
            </div>
          )}
          <div className="prose max-w-none mb-2 text-gray-900">{post.content}</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-xs text-gray-500">
                <span className="font-medium">{post.author.username}</span>
                {' • '}
                {formatForumDateTime(post.created_at)}
              </div>
              {!threadLocked && (
                <CreatePostButton 
                  mode="reply"
                  threadId={post.thread_id}
                  parentPostId={post.id}
                  replyToUsername={post.author.username}
                  onPostCreated={onReply}
                />
              )}
            </div>
            {isAuthor && (
              <button
                onClick={handleDelete}
                className="text-sm text-red-500 hover:text-red-700"
                title="Delete post"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 