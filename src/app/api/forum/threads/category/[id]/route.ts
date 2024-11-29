import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: threads, error } = await supabase
      .from('forum_threads')
      .select(`
        id,
        title,
        content,
        created_at,
        updated_at,
        is_pinned,
        is_locked,
        author_id,
        author:profiles (
          username
        ),
        posts:forum_posts (count)
      `)
      .eq('category_id', params.id)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch threads' }, 
        { status: 500 }
      );
    }

    return NextResponse.json(threads || []);
    
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 