import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateNovelFeedXML } from '@/lib/rssUtils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const novels = await prisma.novel.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit to latest 50 novels
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://lanry.space';
    const xml = generateNovelFeedXML(novels, baseUrl);

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    });
  } catch (error) {
    console.error('Error generating novels RSS feed:', error);
    return NextResponse.json(
      { error: 'Failed to generate RSS feed' },
      { status: 500 }
    );
  }
} 