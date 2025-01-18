import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateChapterFeedXML } from '@/lib/rssUtils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const chapters = await prisma.chapter.findMany({
      where: {
        coins: 0,
        publishAt: {
          lte: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50,
      include: {
        novel: true
      }
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://lanry.space';
    const xml = generateChapterFeedXML(null, chapters, baseUrl);

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=1800'
      }
    });
  } catch (error) {
    console.error('Error generating free chapters RSS feed:', error);
    // Return empty feed instead of error
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://lanry.space';
    const xml = generateChapterFeedXML(null, [], baseUrl);
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=1800'
      }
    });
  }
} 