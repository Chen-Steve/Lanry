import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const novel = await prisma.novel.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        author: true,
        description: true,
        coverImageUrl: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        chapters: {
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: {
            id: true,
            title: true,
            createdAt: true,
          },
        },
        _count: {
          select: { bookmarks: true }
        }
      },
    });

    if (!novel) {
      return NextResponse.json(null, { status: 404 });
    }

    return NextResponse.json({
      ...novel,
      coverImage: novel.coverImageUrl ?? undefined,
      bookmarks: novel._count.bookmarks,
    });
  } catch (error) {
    console.error('Error fetching novel:', error);
    return NextResponse.json(
      { error: 'Failed to fetch novel' },
      { status: 500 }
    );
  }
} 