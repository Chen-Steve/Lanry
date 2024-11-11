import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function PUT(
  request: Request,
  { params }: { params: { novelId: string; chapterId: string } }
) {
  try {
    const { novelId, chapterId } = params;
    const body = await request.json();

    const updatedChapter = await prisma.chapter.update({
      where: {
        id: chapterId,
        novelId: novelId,
      },
      data: {
        chapterNumber: body.chapterNumber,
        title: body.title,
        content: body.content,
      },
    });

    return NextResponse.json(updatedChapter);
  } catch (error) {
    console.error('Error updating chapter:', error);
    
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
      { error: 'Failed to update chapter' },
      { status: 500 }
    );
  }
} 