import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma, NovelStatus } from '@prisma/client';
import { generateNovelSlug } from '@/lib/utils';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Use Prisma's generated types
type NovelData = Prisma.NovelCreateInput;

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { data: { session } } = await supabase.auth.getSession();
    
    const body = await request.json();
    const { title, author, description, status } = body;

    if (!title || !author || !description || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const slug = generateNovelSlug(title);

    const novelData: NovelData = {
      title,
      author,
      description,
      status: status.toUpperCase() as NovelStatus,
      slug,
    };

    if (session?.user) {
      novelData.authorProfile = {
        connect: {
          id: session.user.id
        }
      };
    }

    const novel = await prisma.novel.create({
      data: novelData,
    });

    return NextResponse.json(novel);
  } catch (error) {
    console.error('Error creating novel:', error);
    
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        { error: 'Database connection error' },
        { status: 503 }
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Author profile not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Database operation failed' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const novels = await prisma.novel.findMany({
      where: {
        status: {
          not: 'DRAFT'
        }
      },
      include: {
        _count: {
          select: { chapters: true },
        },
        chapters: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Sort novels by latest chapter date, falling back to novel creation date
    const sortedNovels = novels.sort((a, b) => {
      const aLatestChapter = a.chapters[0]?.createdAt;
      const bLatestChapter = b.chapters[0]?.createdAt;
      
      if (!aLatestChapter && !bLatestChapter) return 0;
      if (!aLatestChapter) return 1;
      if (!bLatestChapter) return -1;
      
      return bLatestChapter.getTime() - aLatestChapter.getTime();
    });

    return NextResponse.json(sortedNovels);
  } catch (error) {
    console.error('Error fetching novels:', error);
    return NextResponse.json({ error: 'Error fetching novels' }, { status: 500 });
  }
} 