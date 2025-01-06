import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

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

    // Get the chapter to get its ID and novel ID
    const chapter = await prisma.chapter.findFirst({
      where: { chapterNumber },
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
  request: Request,
  { params }: { params: { chapterNumber: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const chapterNumber = parseInt(params.chapterNumber);
    if (isNaN(chapterNumber)) {
      return NextResponse.json(
        { error: 'Invalid chapter number' },
        { status: 400 }
      );
    }

    // Get the chapter to get its ID
    const chapter = await prisma.chapter.findFirst({
      where: { chapterNumber },
      select: { id: true, likeCount: true }
    });

    if (!chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    const authHeader = request.headers.get('Authorization');
    let isLiked = false;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user } } = await supabase.auth.getUser(token);

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
    }

    return NextResponse.json({
      likeCount: chapter.likeCount,
      isLiked
    });
  } catch (error) {
    console.error('Error fetching chapter likes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch likes' },
      { status: 500 }
    );
  }
} 