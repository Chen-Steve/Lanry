import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(request: Request) {
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

    const novel = await prisma.novel.create({
      data: {
        title,
        author,
        description,
        status: status.toUpperCase(),
      },
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
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: { chapters: true },
        },
      },
    });

    return NextResponse.json(novels);
  } catch (error) {
    console.error('Error fetching novels:', error);
    return NextResponse.json({ error: 'Error fetching novels' }, { status: 500 });
  }
} 