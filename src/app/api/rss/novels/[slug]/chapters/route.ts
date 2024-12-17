import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateChapterFeedXML } from '@/lib/rssUtils';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const novel = await prisma.novel.findUnique({
      where: { slug: params.slug }
    });

    if (!novel) {
      return NextResponse.json(
        { error: 'Novel not found' },
        { status: 404 }
      );
    }

    const chapters = await prisma.chapter.findMany({
      where: { novelId: novel.id },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit to latest 50 chapters
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://lanry.space';
    const xml = generateChapterFeedXML(novel, chapters, baseUrl);

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    });
  } catch (error) {
    console.error('Error generating chapters RSS feed:', error);
    return NextResponse.json(
      { error: 'Failed to generate RSS feed' },
      { status: 500 }
    );
  }
} 