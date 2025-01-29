import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateChapterFeedXML } from '@/lib/rssUtils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Fetching free chapters for RSS feed...');
    
    const chapters = await prisma.chapter.findMany({
      where: {
        publishAt: {
          lte: new Date()
        }
      },
      orderBy: {
        publishAt: 'desc'
      },
      take: 50,
      include: {
        novel: true
      }
    });

    if (!chapters.length) {
      console.log('No free chapters found');
      // Return empty feed with proper structure instead of error
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.lanry.space';
      const xml = generateChapterFeedXML(null, [], baseUrl);
      return new NextResponse(xml, {
        headers: {
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, max-age=1800'
        }
      });
    }

    console.log(`Found ${chapters.length} free chapters`);
    console.log('First chapter:', {
      title: chapters[0].title,
      novelTitle: chapters[0].novel.title,
      publishAt: chapters[0].publishAt,
      coins: chapters[0].coins
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.lanry.space';
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
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.lanry.space';
    const xml = generateChapterFeedXML(null, [], baseUrl);
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=1800'
      }
    });
  }
} 