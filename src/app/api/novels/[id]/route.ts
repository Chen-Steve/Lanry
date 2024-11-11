import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

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

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, author, description, status } = body;

    // Validate input
    if (!title || !author || !description || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const novel = await prisma.novel.update({
      where: { id: params.id },
      data: {
        title,
        author,
        description,
        status: status.toUpperCase(),
      },
    });

    return NextResponse.json(novel);
  } catch (error) {
    console.error('Error updating novel:', error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Novel not found' },
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