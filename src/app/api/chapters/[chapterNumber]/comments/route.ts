import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(
  request: Request,
  { params }: { params: { chapterNumber: string } }
) {
  try {
    const chapterNumber = parseInt(params.chapterNumber);
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: comments, error } = await supabase
      .from('chapter_comments')
      .select(`
        *,
        profile:profiles (username)
      `)
      .eq('chapter_number', chapterNumber)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error in GET comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { chapterNumber: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chapterNumber = parseInt(params.chapterNumber);
    const { paragraphId, content, novelId } = await request.json();

    // Generate a UUID using globalThis.crypto
    const commentId = globalThis.crypto.randomUUID();

    const { data: comment, error } = await supabase
      .from('chapter_comments')
      .insert([{
        id: commentId,
        chapter_number: chapterNumber,
        paragraph_id: paragraphId,
        content,
        profile_id: session.user.id,
        novel_id: novelId
      }])
      .select(`
        *,
        profile:profiles (username)
      `)
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(comment);
  } catch (error) {
    console.error('Error in POST comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
} 