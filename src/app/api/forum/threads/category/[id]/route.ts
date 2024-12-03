import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ForumThread } from '@/types/database';

interface ForumPost {
  created_at: string;
  count?: number;
}

interface ThreadData extends Omit<ForumThread, 'posts'> {
  posts?: ForumPost[];
  latest_post_at?: string;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // First, get the threads with basic info and post count
    const { data: threads, error } = await supabase
      .from('forum_threads')
      .select(`
        *,
        author:author_id(id, username),
        posts:forum_posts(count)
      `)
      .eq('category_id', params.id);

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    if (!threads) {
      return NextResponse.json([]);
    }

    // Then, get the latest post date for each thread
    const threadIds = threads.map(thread => thread.id);
    const { data: latestPosts, error: latestPostsError } = await supabase
      .from('forum_posts')
      .select('thread_id, created_at')
      .in('thread_id', threadIds)
      .order('created_at', { ascending: false });

    if (latestPostsError) {
      console.error('Error fetching latest posts:', latestPostsError);
      throw latestPostsError;
    }

    // Create a map of thread ID to latest post date
    const latestPostDates = new Map<string, string>();
    latestPosts?.forEach(post => {
      if (!latestPostDates.has(post.thread_id)) {
        latestPostDates.set(post.thread_id, post.created_at);
      }
    });

    // Transform the data to include reply_count and latest_activity
    const threadsWithCounts = (threads as ThreadData[]).map(thread => ({
      ...thread,
      reply_count: thread.posts?.[0]?.count ?? 0,
      latest_activity: latestPostDates.get(thread.id) || thread.created_at
    }));

    // Sort threads by pinned status first, then by latest activity
    const sortedThreads = threadsWithCounts.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) {
        return a.is_pinned ? -1 : 1;
      }
      return new Date(b.latest_activity).getTime() - new Date(a.latest_activity).getTime();
    });

    return NextResponse.json(sortedThreads);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 