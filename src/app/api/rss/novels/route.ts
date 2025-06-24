import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateNovelFeedXML } from '@/lib/rssUtils';
import { Novel } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Fetch the 10 most recent novels by creation date
    const latestNovelsRaw = await prisma.novel.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      where: {
        status: {
          not: 'DRAFT',
        },
      },
      // Selecting only the fields used by the RSS generator keeps the query lightweight
      select: {
        id: true,
        createdAt: true,
        title: true,
        slug: true,
        description: true,
        author: true,
        coverImageUrl: true,
        translator: {
          select: {
            username: true,
          },
        },
        isAuthorNameCustom: true,
        authorProfile: {
          select: {
            username: true,
          },
        },
      },
    });

    const latestNovels = latestNovelsRaw.map(n => {
      // Remove the nested translator object to align with Novel type shape
      // and attach its username as translatorUsername.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { translator, authorProfile, ...rest } = n as any;
      return {
        ...rest,
        translatorUsername: translator?.username ?? null,
        authorProfileUsername: authorProfile?.username ?? null,
      };
    });

    const baseUrl = new URL(request.url).origin;
    const xml = generateNovelFeedXML(latestNovels as unknown as Novel[], baseUrl);

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        // Cache for 15 minutes; downstream services like MonitoRSS poll frequently
        'Cache-Control': 'public, max-age=900',
      },
    });
  } catch (error) {
    console.error('Error generating Novels RSS feed:', error);
    return NextResponse.json(
      { error: 'Failed to generate novels RSS feed' },
      { status: 500 },
    );
  }
} 