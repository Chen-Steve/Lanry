'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ForumThread, ForumPost } from '@/types/database';
import { Icon } from '@iconify/react';
import CreatePostButton from './CreatePostButton';
import { toast } from 'react-hot-toast';
import supabase from '@/lib/supabaseClient';
import PostItem from './PostItem';
import VoteControls from './VoteControls';
import { formatForumDateTime } from '@/lib/utils';

interface ThreadDetailProps {
  threadId: string;
}

interface ThreadWithLikes extends ForumThread {
  isLiked?: boolean;
}

interface PostWithLikes extends ForumPost {
  isLiked?: boolean;
}

export default function ThreadDetail({ threadId }: ThreadDetailProps) {
  const [thread, setThread] = useState<ThreadWithLikes | null>(null);
  const [posts, setPosts] = useState<PostWithLikes[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState<string>('');
  const [isVoting, setIsVoting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadThread = async () => {
      try {
        // Get the auth session first
        const { data: { session } } = await supabase.auth.getSession();
        
        // Fetch thread details with auth header
        const threadResponse = await fetch(`/api/forum/threads/${threadId}`, {
          headers: session?.access_token ? {
            'Authorization': `Bearer ${session.access_token}`
          } : undefined
        });
        if (!threadResponse.ok) throw new Error('Failed to fetch thread');
        const threadData = await threadResponse.json();
        setThread(threadData);

        // Fetch category details
        const categoryResponse = await fetch(`/api/forum/categories/${threadData.category_id}`);
        if (categoryResponse.ok) {
          const categoryData = await categoryResponse.json();
          setCategoryName(categoryData.name);
        }

        // Fetch thread posts with auth header
        const postsResponse = await fetch(`/api/forum/threads/${threadId}/posts`, {
          headers: session?.access_token ? {
            'Authorization': `Bearer ${session.access_token}`
          } : undefined
        });
        if (!postsResponse.ok) throw new Error('Failed to fetch posts');
        const postsData = await postsResponse.json();
        setPosts(postsData);
      } catch (error) {
        console.error('Error loading thread:', error);
      } finally {
        setLoading(false);
      }
    };

    loadThread();
  }, [threadId]);

  const handleVote = async (type: 'thread' | 'post', id: string) => {
    if (isVoting) return;
    
    try {
      setIsVoting(true);
      const response = await fetch(`/api/forum/${type}s/${id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to vote');
      }
      
      const data = await response.json();
      
      if (type === 'thread') {
        setThread(prev => prev ? { ...prev, score: data.score, isLiked: data.liked } : null);
      } else {
        setPosts(prev => prev.map(post => 
          post.id === id ? { ...post, score: data.score, isLiked: data.liked } : post
        ));
      }
    } catch (error: unknown) {
      console.error('Error voting:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to vote. Please try again.');
    } finally {
      setIsVoting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (isDeleting) return;

    try {
      setIsDeleting(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('You must be logged in to delete a post');
      }

      const response = await fetch('/api/forum/posts', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ postId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to delete post (${response.status})`);
      }

      // Remove the deleted post
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      toast.success('Post deleted successfully');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  };

  // Create a map of parent posts for quick lookup
  const postsMap = posts.reduce((acc, post) => {
    acc[post.id] = post;
    return acc;
  }, {} as Record<string, ForumPost>);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Icon icon="eos-icons:loading" className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="text-center py-8">
        <Icon icon="mdi:alert" className="w-16 h-16 mx-auto text-destructive mb-4" />
        <p className="text-muted-foreground">Thread not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Thread Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/forum" className="hover:text-foreground transition-colors">Forum</Link>
          <Icon icon="mdi:chevron-right" className="w-4 h-4" />
          <Link href={`/forum/category/${thread.category_id}`} className="hover:text-foreground transition-colors">
            {categoryName}
          </Link>
          <Icon icon="mdi:chevron-right" className="w-4 h-4" />
          <span className="text-foreground truncate">{thread.title}</span>
        </div>
        <div className="bg-background rounded p-4 hover:border-accent border border-border">
          <div className="flex">
            <VoteControls 
              score={thread.score || 0}
              isLiked={thread.isLiked}
              onUpvote={() => handleVote('thread', thread.id)}
            />
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-xl font-medium text-foreground">
                  {thread.is_pinned && (
                    <span className="text-emerald-500 dark:text-emerald-400 mr-2" title="Pinned">
                      <Icon icon="mdi:pin" className="inline-block w-4 h-4" />
                    </span>
                  )}
                  {thread.title}
                </h1>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground" title="Replies">
                    <Icon icon="mdi:comment-outline" className="inline-block w-4 h-4 mr-1" />
                    {posts.length}
                  </span>
                  {thread.is_locked && (
                    <span className="text-destructive" title="Locked">
                      <Icon icon="mdi:lock" className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </div>
              <div className="prose dark:prose-invert max-w-none mb-2">{thread.content}</div>
              <div className="text-xs text-muted-foreground">
                Posted by {thread.author.username} • {formatForumDateTime(thread.created_at)}
              </div>
            </div>
          </div>
        </div>
        {!thread.is_locked && (
          <div className="mt-4 ml-9">
            <CreatePostButton 
              mode="thread-reply"
              threadId={threadId}
              replyToUsername={thread.author.username}
              onPostCreated={(newPost: ForumPost) => {
                setPosts([...posts, newPost]);
              }}
            />
          </div>
        )}
      </div>

      {/* Posts */}
      <div className="space-y-3">
        {posts.map((post) => (
          <PostItem 
            key={post.id}
            post={post}
            onVoteUp={() => handleVote('post', post.id)}
            onReply={(newPost: ForumPost) => {
              setPosts([...posts, newPost]);
            }}
            onDelete={handleDeletePost}
            threadLocked={thread.is_locked}
            parentPost={post.parent_post_id ? postsMap[post.parent_post_id] : undefined}
          />
        ))}
      </div>
    </div>
  );
} 