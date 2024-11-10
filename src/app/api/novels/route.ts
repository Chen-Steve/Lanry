import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, author, description, status } = body;

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
    return NextResponse.json({ error: 'Error creating novel' }, { status: 500 });
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