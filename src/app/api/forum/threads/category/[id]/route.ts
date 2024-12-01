import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { data: threads, error } = await supabase
      .from('forum_threads')
      .select(`
        *,
        author:author_id(id, username),
        posts:forum_posts(count)
      `)
      .eq('category_id', params.id)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    if (!threads) {
      return NextResponse.json([]);
    }

    // Transform the data to include reply_count, with null check
    const threadsWithCounts = threads.map(thread => ({
      ...thread,
      reply_count: thread.posts?.[0]?.count ?? 0
    }));

    return NextResponse.json(threadsWithCounts);
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