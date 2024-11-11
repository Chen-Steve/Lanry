import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { novelId: string } }
) {
  try {
    const body = await request.json();
    const { chapterNumber, title, content } = body;

    const chapter = await prisma.chapter.create({
      data: {
        chapterNumber,
        title,
        content,
        novelId: params.novelId,
      },
    });

    return NextResponse.json(chapter);
  } catch (error) {
    console.error('Error creating chapter:', error);
    return NextResponse.json({ error: 'Error creating chapter' }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { novelId: string } }
) {
  try {
    const chapters = await prisma.chapter.findMany({
      where: {
        novelId: params.novelId,
      },
      orderBy: {
        chapterNumber: 'asc',
      },
    });

    return NextResponse.json(chapters);
  } catch (error) {
    console.error('Error fetching chapters:', error);
    return NextResponse.json({ error: 'Error fetching chapters' }, { status: 500 });
  }
} 