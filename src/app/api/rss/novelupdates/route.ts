import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateChapterFeedXML } from '@/lib/rssUtils';

interface RawChapter {
  id: string;
  slug: string | null;
  title: string;
  chapterNumber: number;
  partNumber: number | null;
  createdAt: Date;
  publishAt: Date | null;
  novel: {
    title: string;
    slug: string;
    author: string;
  };
}

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Fetch the 50 most-recent public chapters (free or timer-expired),
    // ranked by the moment they became publicly viewable. We use a raw SQL
    // query so we can order by `COALESCE(publish_at, created_at)` directly
    // in the database, which is more efficient than pulling lots of rows
    // into JavaScript and sorting there.

    const latestChapters = await prisma.$queryRaw<RawChapter[]>`
      SELECT
        c.id,
        c.slug,
        c.title,
        c.chapter_number  AS "chapterNumber",
        c.part_number     AS "partNumber",
        c.created_at      AS "createdAt",
        c.publish_at      AS "publishAt",
        json_build_object(
          'title',  n.title,
          'slug',   n.slug,
          'author', n.author
        ) AS novel
      FROM   chapters AS c
      JOIN   novels   AS n ON n.id = c.novel_id
      WHERE  (c.coins = 0 OR c.publish_at <= NOW())
        AND  COALESCE(c.publish_at, c.created_at) >= date_trunc('day', NOW())
      ORDER  BY COALESCE(c.publish_at, c.created_at) DESC
      LIMIT  200;
    `;

    if (!latestChapters.length) {
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

    console.log(`Found ${latestChapters.length} chapters for NovelUpdates RSS feed`);
    
    const baseUrl = new URL(request.url).origin;
    // The RSS util accepts a broad chapter type; casting here is safe because
    // the raw query selected exactly the fields the generator needs.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const xml = generateChapterFeedXML(null, latestChapters as unknown as any[], baseUrl);

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