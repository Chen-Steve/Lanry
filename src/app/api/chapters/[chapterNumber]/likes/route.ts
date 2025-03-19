import { NextResponse, type NextRequest } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

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

      // Revalidate the cache for this chapter's likes
      revalidatePath(`/api/chapters/${chapterNumber}/likes?novelId=${novelId}`);

      return NextResponse.json({ 
        likeCount: updatedChapter?.likeCount || 0,
        isLiked: false
      });
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

      // Revalidate the cache for this chapter's likes
      revalidatePath(`/api/chapters/${chapterNumber}/likes?novelId=${novelId}`);

      return NextResponse.json({ 
        likeCount: updatedChapter?.likeCount || 0,
        isLiked: true
      });
    }
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
    let response;

    if (authHeader?.startsWith('Bearer ')) {
      // For authenticated users - shorter cache due to personalized isLiked field
      response = await handleAuthenticatedGet(authHeader, novelId, chapterNumber);
      response.headers.set('Cache-Control', 'private, s-maxage=30');
    } else {
      // For anonymous users - longer cache since we only return likeCount
      response = await handleAnonymousGet(novelId, chapterNumber);
      response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    }

    return response;
  } catch (error) {
    console.error('Error fetching chapter likes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch likes' },
      { status: 500 }
    );
  }
}

async function handleAuthenticatedGet(authHeader: string, novelId: string, chapterNumber: number) {
  const token = authHeader.split(' ')[1];
  const { data: { user } } = await createRouteHandlerClient({ cookies }).auth.getUser(token);

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

  return NextResponse.json({
    likeCount: chapter.likeCount,
    isLiked
  });
}

async function handleAnonymousGet(novelId: string, chapterNumber: number) {
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

  return NextResponse.json({
    likeCount: chapter.likeCount,
    isLiked: false
  });
} 