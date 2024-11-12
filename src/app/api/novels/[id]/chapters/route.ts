import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateChapterSlug } from '@/lib/utils';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { chapterNumber, title, content } = body;
    const novelId = params.id;

    // Validate required fields
    if (typeof chapterNumber !== 'number' || !content?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // First verify the novel exists
    const novel = await prisma.novel.findUnique({
      where: { id: novelId },
    });

    if (!novel) {
      return NextResponse.json(
        { error: 'Novel not found' },
        { status: 404 }
      );
    }

    // Generate slug
    const slug = generateChapterSlug(chapterNumber, title);

    const chapter = await prisma.chapter.create({
      data: {
        chapterNumber,
        title: title?.trim() ?? '',
        content: content.trim(),
        slug,
        novel: {
          connect: { id: novelId }
        }
      },
    });

    return NextResponse.json(chapter);
  } catch (error) {
    console.error('Error creating chapter:', error);
    return NextResponse.json(
      { error: 'Error creating chapter' },
      { status: 500 }
    );
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