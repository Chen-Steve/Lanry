import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateChapterFeedXML } from '@/lib/rssUtils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Fetching free chapters for RSS feed...');
    
    // First check total number of chapters with coins = 0
    const totalFreeChapters = await prisma.chapter.count({
      where: {
        coins: 0
      }
    });
    
    console.log(`Total chapters with coins = 0: ${totalFreeChapters}`);
    
    // Then check how many are published
    const publishedFreeChapters = await prisma.chapter.count({
      where: {
        coins: 0,
        publishAt: {
          lte: new Date()
        }
      }
    });
    
    console.log(`Published chapters with coins = 0: ${publishedFreeChapters}`);
    
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

    console.log(`Found ${chapters.length} free chapters for feed`);
    if (chapters.length === 0) {
      console.log('No chapters found. Current query conditions:');
      console.log('- coins: 0');
      console.log(`- publishAt <= ${new Date().toISOString()}`);
    } else {
      console.log('First chapter details:', {
        title: chapters[0].title,
        novelTitle: chapters[0].novel.title,
        publishAt: chapters[0].publishAt,
        createdAt: chapters[0].createdAt
      });
    }

    const baseUrl = 'https://www.lanry.space';
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
    const baseUrl = 'https://www.lanry.space';
    const xml = generateChapterFeedXML(null, [], baseUrl);
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=1800'
      }
    });
  }
} 