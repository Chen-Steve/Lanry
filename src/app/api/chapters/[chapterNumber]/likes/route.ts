import { NextResponse, type NextRequest } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Add a cache response helper
function cachedResponse(data: { likeCount: number; isLiked: boolean }, isAuthenticated: boolean) {
  const response = NextResponse.json(data);
  
  if (isAuthenticated) {
    // For authenticated users - 5 minutes cache, private
    response.headers.set('Cache-Control', 'private, max-age=300');
  } else {
    // For anonymous users - 15 minutes with revalidation
    response.headers.set('Cache-Control', 'public, max-age=900, stale-while-revalidate=3600');
  }
  
  return response;
}

export async function POST(
  request: Request,
  { params }: { params: { chapterNumber: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const chapterNumber = parseInt(params.chapterNumber);
    if (isNaN(chapterNumber)) {
      return NextResponse.json(
        { error: 'Invalid chapter number' },
        { status: 400 }
      );
    }

    // Get the novel ID from the request body
    const { novelId } = await request.json();
    if (!novelId) {
      return NextResponse.json(
        { error: 'Novel ID is required' },
        { status: 400 }
      );
    }

    // Get the chapter to get its ID and novel ID using Supabase
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select('id, novel_id')
      .eq('chapter_number', chapterNumber)
      .eq('novel_id', novelId)
      .single();

    if (chapterError || !chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    // Check if user has already liked using Supabase
    const { data: existingLike } = await supabase
      .from('chapter_likes')
      .select('id')
      .eq('profile_id', user.id)
      .eq('chapter_id', chapter.id)
      .single();

    let result;
    
    if (existingLike) {
      // Remove like if it exists
      const { error: deleteLikeError } = await supabase
        .from('chapter_likes')
        .delete()
        .eq('id', existingLike.id);

      if (deleteLikeError) throw deleteLikeError;

      // Get current like count
      const { data: currentChapter } = await supabase
        .from('chapters')
        .select('like_count')
        .eq('id', chapter.id)
        .single();
        
      const currentLikeCount = currentChapter?.like_count || 0;

      // Update the chapter's like count
      const { data: updatedChapter, error: updateChapterError } = await supabase
        .from('chapters')
        .update({ like_count: Math.max(0, currentLikeCount - 1) })
        .eq('id', chapter.id)
        .select('like_count')
        .single();

      if (updateChapterError) throw updateChapterError;

      result = { 
        likeCount: updatedChapter?.like_count || 0,
        isLiked: false
      };
    } else {
      // Create new like
      const { error: createLikeError } = await supabase
        .from('chapter_likes')
        .insert([{
          id: crypto.randomUUID(),
          profile_id: user.id,
          chapter_id: chapter.id,
          novel_id: chapter.novel_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (createLikeError) throw createLikeError;

      // Get current like count
      const { data: currentChapter } = await supabase
        .from('chapters')
        .select('like_count')
        .eq('id', chapter.id)
        .single();
        
      const currentLikeCount = currentChapter?.like_count || 0;

      // Update the chapter's like count
      const { data: updatedChapter, error: updateChapterError } = await supabase
        .from('chapters')
        .update({ like_count: currentLikeCount + 1 })
        .eq('id', chapter.id)
        .select('like_count')
        .single();

      if (updateChapterError) throw updateChapterError;

      result = { 
        likeCount: updatedChapter?.like_count || 0,
        isLiked: true
      };
    }

    // Revalidate only the specific path for this chapter/novel
    revalidatePath(`/api/chapters/${chapterNumber}/likes?novelId=${novelId}`);
    
    const response = NextResponse.json(result);
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (error) {
    console.error('Error handling chapter like:', error);
    return NextResponse.json(
      { error: 'Failed to handle like' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { chapterNumber: string } }
) {
  try {
    const chapterNumber = parseInt(params.chapterNumber);
    if (isNaN(chapterNumber)) {
      return NextResponse.json(
        { error: 'Invalid chapter number' },
        { status: 400 }
      );
    }

    // Get the novel ID from the query params
    const novelId = request.nextUrl.searchParams.get('novelId');
    if (!novelId) {
      return NextResponse.json(
        { error: 'Novel ID is required' },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get('Authorization');
    
    if (authHeader?.startsWith('Bearer ')) {
      // For authenticated users
      return await handleAuthenticatedGet(authHeader, novelId, chapterNumber);
    } else {
      // For anonymous users
      return await handleAnonymousGet(novelId, chapterNumber);
    }
  } catch (error) {
    console.error('Error fetching chapter likes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch likes' },
      { status: 500 }
    );
  }
}

async function handleAuthenticatedGet(authHeader: string, novelId: string, chapterNumber: number) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  const token = authHeader.split(' ')[1];
  const { data: { user } } = await supabase.auth.getUser(token);

  // Get chapter using Supabase
  const { data: chapter, error: chapterError } = await supabase
    .from('chapters')
    .select('id, like_count')
    .eq('chapter_number', chapterNumber)
    .eq('novel_id', novelId)
    .single();

  if (chapterError || !chapter) {
    return NextResponse.json(
      { error: 'Chapter not found' },
      { status: 404 }
    );
  }

  let isLiked = false;
  if (user) {
    // Only query the like status if we have a user
    const { data: existingLike } = await supabase
      .from('chapter_likes')
      .select('id')
      .eq('profile_id', user.id)
      .eq('chapter_id', chapter.id)
      .single();
      
    isLiked = !!existingLike;
  }

  return cachedResponse({
    likeCount: chapter.like_count,
    isLiked
  }, true);
}

async function handleAnonymousGet(novelId: string, chapterNumber: number) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  // Get only the like count using Supabase
  const { data: chapter, error: chapterError } = await supabase
    .from('chapters')
    .select('like_count')
    .eq('chapter_number', chapterNumber)
    .eq('novel_id', novelId)
    .single();

  if (chapterError || !chapter) {
    return NextResponse.json(
      { error: 'Chapter not found' },
      { status: 404 }
    );
  }

  return cachedResponse({
    likeCount: chapter.like_count,
    isLiked: false
  }, false);
} 