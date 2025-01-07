import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { generateChapterSlug } from '@/lib/utils';

// Custom error handler function
const handlePrismaError = (error: unknown) => {
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
};

interface ChapterInput {
  chapterNumber: number;
  title?: string;
  content: string;
  publishAt?: string;
  ageRating?: 'EVERYONE' | 'TEEN' | 'MATURE';
  authorThoughts?: string;
}

// Updated input validation function
const validateInput = (body: ChapterInput): boolean => {
  const { chapterNumber, content } = body;
  
  if (!content?.trim()) {
    return false;
  }
  
  if (typeof chapterNumber !== 'number' || chapterNumber < 0) {
    return false;
  }
  
  return true;
};

export async function PUT(
  request: Request,
  { params }: { params: { id: string; chapterId: string } }
) {
  try {
    const { id: novelId, chapterId } = params;
    const body = await request.json() as ChapterInput;

    if (!validateInput(body)) {
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      );
    }

    // Generate simple slug
    const slug = generateChapterSlug(body.chapterNumber);

    const updatedChapter = await prisma.chapter.update({
      where: {
        id: chapterId,
        novelId: novelId,
      },
      data: {
        chapterNumber: body.chapterNumber,
        title: body.title?.trim() ?? '',
        content: body.content.trim(),
        slug,
        publishAt: body.publishAt ? new Date(body.publishAt) : null,
        ageRating: body.ageRating || 'EVERYONE',
        authorThoughts: body.authorThoughts?.trim(),
      },
    });

    return NextResponse.json(updatedChapter);
  } catch (error) {
    console.error('Error updating chapter:', error);
    return handlePrismaError(error);
  }
} 