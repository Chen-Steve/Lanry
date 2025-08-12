import { NextResponse } from 'next/server';
import { generateChapterFeedXML } from '@/lib/rssUtils';
import { createServerClient } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();

    const now = new Date();
    const nowISO = now.toISOString();
    const past24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const past24ISO = past24.toISOString();

    // Fetch the 200 most-recent public chapters (free or timer-expired)
    const { data: rows, error } = await supabase
      .from('chapters')
      .select(`
        id,
        slug,
        title,
        chapter_number,
        part_number,
        created_at,
        publish_at,
        novel:novels(
          title,
          slug,
          author,
          cover_image_url,
          is_author_name_custom,
          translator:translator_id ( username ),
          authorProfile:author_profile_id ( username )
        )
      `)
      .or(`coins.eq.0,publish_at.lte.${nowISO}`)
      .or(`and(publish_at.is.null,created_at.gte.${past24ISO}),publish_at.gte.${past24ISO}`)
      .limit(200);

    if (error) throw error;

    type Row = {
      id: string;
      slug: string | null;
      title: string;
      chapter_number: number;
      part_number: number | null;
      created_at: string;
      publish_at: string | null;
      novel: {
        title: string;
        slug: string;
        author: string | null;
        cover_image_url: string | null;
        is_author_name_custom: boolean | null;
        translator?: { username: string | null } | null;
        authorProfile?: { username: string | null } | null;
      } | null;
    };

    const latestChapters = ((rows || []) as unknown as Row[])
      .map((r) => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        chapterNumber: r.chapter_number,
        partNumber: r.part_number,
        createdAt: r.created_at,
        publishAt: r.publish_at,
        novel: {
          title: r.novel?.title ?? '',
          slug: r.novel?.slug ?? '',
          author: r.novel?.author ?? '',
          coverImageUrl: r.novel?.cover_image_url ?? null,
          translatorUsername: r.novel?.translator?.username ?? null,
          isAuthorNameCustom: r.novel?.is_author_name_custom ?? false,
          authorProfileUsername: r.novel?.authorProfile?.username ?? null,
        },
      }))
      // Sort by public time desc: COALESCE(publish_at, created_at)
      .sort((a, b) => {
        const ta = new Date(a.publishAt || a.createdAt).getTime();
        const tb = new Date(b.publishAt || b.createdAt).getTime();
        return tb - ta;
      });

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