import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateChapterFeedXML } from '@/lib/rssUtils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Get chapters that are either:
    // 1. Free (coins = 0) OR
    // 2. Published (publish date has passed)
    const chapters = await prisma.chapter.findMany({
      where: {
        OR: [
          // Chapters that are completely free (coins = 0)
          { coins: { equals: 0 } },
          // Chapters that were premium but whose timer has expired
          { publishAt: { lte: new Date() } }
        ]
      },
      // Order so that:
      // 1. Chapters with a non-null publishAt are sorted newest-first
      // 2. Chapters whose publishAt is NULL (free/instant releases) are
      //    then sorted by their creation time.
      orderBy: [
        { publishAt: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 50, // Limit to latest 50 chapters
      include: {
        novel: true // Include novel data for the feed
      }
    });

    if (!chapters.length) {
      console.log('No chapters found for NovelUpdates RSS feed');
      // Return empty feed with proper structure
      const baseUrl = new URL(request.url).origin;
      const xml = generateChapterFeedXML(null, [], baseUrl);
      return new NextResponse(xml, {
        headers: {
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, max-age=900' // Cache for 15 minutes
        }
      });
    }

    console.log(`Found ${chapters.length} chapters for NovelUpdates RSS feed`);
    
    const baseUrl = new URL(request.url).origin;
    const xml = generateChapterFeedXML(null, chapters, baseUrl);

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=900' // Cache for 15 minutes
      }
    });
  } catch (error) {
    console.error('Error generating NovelUpdates RSS feed:', error);
    return NextResponse.json(
      { error: 'Failed to generate RSS feed' },
      { status: 500 }
    );
  }
} 