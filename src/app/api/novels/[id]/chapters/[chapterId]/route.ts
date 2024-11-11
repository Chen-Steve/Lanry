import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    return NextResponse.json(
      { error: 'Failed to update chapter' },
      { status: 500 }
    );
  }
} 