import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateChapterSlug } from '@/lib/utils';
import { Prisma } from '@prisma/client';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { chapterNumber, title, content, publishAt } = body;
    const novelId = params.id;

    // Validate required fields
    if (typeof chapterNumber !== 'number' || !content?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate simple slug
    const slug = generateChapterSlug(chapterNumber);

    const chapter = await prisma.chapter.create({
      data: {
        chapterNumber,
        title: title?.trim() ?? '',
        content: content.trim(),
        slug,
        publishAt: publishAt ? new Date(publishAt) : null,
        novel: {
          connect: { id: novelId }
        }
      },
    });

    return NextResponse.json(chapter);
  } catch (error) {
    console.error('Error creating chapter:', error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'A chapter with this number already exists' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Error creating chapter' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const chapters = await prisma.chapter.findMany({
      where: {
        novelId: params.id,
      },
      orderBy: {
        chapterNumber: 'asc',
      },
    });

    return NextResponse.json(chapters);
  } catch (error) {
    console.error('Error fetching chapters:', error);
    return NextResponse.json(
      { error: 'Error fetching chapters' }, 
      { status: 500 }
    );
  }
} 