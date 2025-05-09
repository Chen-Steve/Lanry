import { NextResponse, type NextRequest } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
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

    // Get the chapter to get its ID and novel ID
    const chapter = await prisma.chapter.findFirst({
      where: { 
        chapterNumber,
        novelId 
      },
      select: { id: true, novelId: true }
    });

    if (!chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    // Check if user has already liked
    const existingLike = await prisma.chapterLike.findUnique({
      where: {
        profileId_chapterId: {
          profileId: user.id,
          chapterId: chapter.id
        }
      }
    });

    let result;
    
    if (existingLike) {
      // Remove like if it exists
      await prisma.$transaction([
        prisma.chapterLike.delete({
          where: { id: existingLike.id }
        }),
        prisma.chapter.update({
          where: { id: chapter.id },
          data: {
            likeCount: { decrement: 1 }
          }
        })
      ]);

      const updatedChapter = await prisma.chapter.findUnique({
        where: { id: chapter.id },
        select: { likeCount: true }
      });

      result = { 
        likeCount: updatedChapter?.likeCount || 0,
        isLiked: false
      };
    } else {
      // Create new like
      await prisma.$transaction([
        prisma.chapterLike.create({
          data: {
            profileId: user.id,
            chapterId: chapter.id,
            novelId: chapter.novelId
          }
        }),
        prisma.chapter.update({
          where: { id: chapter.id },
          data: {
            likeCount: { increment: 1 }
          }
        })
      ]);

      const updatedChapter = await prisma.chapter.findUnique({
        where: { id: chapter.id },
        select: { likeCount: true }
      });

      result = { 
        likeCount: updatedChapter?.likeCount || 0,
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

  // Single database query to get chapter
  const chapter = await prisma.chapter.findFirst({
    where: { 
      chapterNumber,
      novelId 
    },
    select: { id: true, likeCount: true }
  });

  if (!chapter) {
    return NextResponse.json(
      { error: 'Chapter not found' },
      { status: 404 }
    );
  }

  let isLiked = false;
  if (user) {
    // Only query the like status if we have a user
    const existingLike = await prisma.chapterLike.findUnique({
      where: {
        profileId_chapterId: {
          profileId: user.id,
          chapterId: chapter.id
        }
      }
    });
    isLiked = !!existingLike;
  }

  return cachedResponse({
    likeCount: chapter.likeCount,
    isLiked
  }, true);
}

async function handleAnonymousGet(novelId: string, chapterNumber: number) {
  // Simple database query to get only the like count
  const chapter = await prisma.chapter.findFirst({
    where: { 
      chapterNumber,
      novelId 
    },
    select: { likeCount: true }
  });

  if (!chapter) {
    return NextResponse.json(
      { error: 'Chapter not found' },
      { status: 404 }
    );
  }

  return cachedResponse({
    likeCount: chapter.likeCount,
    isLiked: false
  }, false);
} 