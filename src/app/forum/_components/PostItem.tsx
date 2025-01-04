'use client';

import { ForumPost } from '@/types/database';
import { Icon } from '@iconify/react';
import { useUser } from '@/hooks/useUser';
import CreatePostButton from './CreatePostButton';
import VoteControls from './VoteControls';
import { formatForumDateTime } from '@/lib/utils';
import { useState } from 'react';

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
  const [showReplyForm, setShowReplyForm] = useState(false);

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this post?')) {
      onDelete(post.id);
    }
  };

  const handleReplyClick = () => {
    setShowReplyForm(true);
  };

  return (
    <div className="bg-background rounded p-4 hover:border-accent border border-border">
      <div className="flex">
        <VoteControls 
          score={post.score || 0}
          isLiked={post.isLiked}
          onUpvote={onVoteUp}
        />
        <div className="flex-1">
          {parentPost && (
            <div className="mb-3 pl-3 border-l-2 border-border">
              <div className="text-xs text-muted-foreground mb-1">
                <Icon icon="mdi:reply" className="w-3 h-3 inline mr-1" />
                Replying to @{parentPost.author.username}
              </div>
              <div className="text-sm text-muted-foreground line-clamp-2">
                {parentPost.content}
              </div>
            </div>
          )}
          <div className="prose dark:prose-invert max-w-none mb-2">{post.content}</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">{post.author.username}</span>
                {' • '}
                {formatForumDateTime(post.created_at)}
              </div>
              <div className="flex items-center gap-3 text-sm">
                {!threadLocked && (
                  <button
                    onClick={handleReplyClick}
                    className="text-primary hover:text-primary/90 flex items-center"
                  >
                    <Icon icon="mdi:reply" className="w-4 h-4 mr-1" />
                    Reply
                  </button>
                )}
                {isAuthor && (
                  <button
                    onClick={handleDelete}
                    className="text-destructive hover:text-destructive/90 flex items-center"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
          {showReplyForm && !threadLocked && (
            <div className="mt-4">
              <CreatePostButton 
                mode="reply"
                threadId={post.thread_id}
                parentPostId={post.id}
                replyToUsername={post.author.username}
                onPostCreated={(newPost) => {
                  onReply(newPost);
                  setShowReplyForm(false);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 