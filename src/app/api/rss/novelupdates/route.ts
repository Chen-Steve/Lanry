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
          // Free chapters
          {
            coins: {
              equals: 0
            }
          },
          // Published chapters (timer has expired)
          {
            publishAt: {
              lte: new Date()
            }
          }
        ]
      },
      orderBy: {
        publishAt: 'desc' // Most recently published first
      },
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