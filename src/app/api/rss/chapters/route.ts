import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateChapterFeedXML } from '@/lib/rssUtils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const chapters = await prisma.chapter.findMany({
      where: {
        publishAt: {
          lte: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50, // Limit to latest 50 chapters
      include: {
        novel: true // Include novel data for the feed
      }
    });

    if (!chapters.length) {
      return NextResponse.json(
        { error: 'No chapters found' },
        { status: 404 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://lanry.space';
    const xml = generateChapterFeedXML(null, chapters, baseUrl);

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=1800' // Cache for 30 minutes
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