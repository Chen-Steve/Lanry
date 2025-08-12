import { NextResponse } from 'next/server';
import { generateNovelFeedXML } from '@/lib/rssUtils';
import { createServerClient } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();

    // Fetch the 10 most recent novels by creation date (excluding drafts)
    const { data: latestNovelsRaw, error } = await supabase
      .from('novels')
      .select(`
        id,
        created_at,
        title,
        slug,
        description,
        author,
        cover_image_url,
        is_author_name_custom,
        translator:translator_id ( username ),
        authorProfile:author_profile_id ( username )
      `)
      .neq('status', 'DRAFT')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    interface LatestNovelRow {
      id: string;
      created_at: string;
      title: string;
      slug: string;
      description: string | null;
      author: string | null;
      cover_image_url: string | null;
      is_author_name_custom: boolean | null;
      translator?: { username: string | null } | null;
      authorProfile?: { username: string | null } | null;
    }

    const rows = (latestNovelsRaw || []) as unknown as LatestNovelRow[];
    const latestNovels = rows.map((n) => ({
      id: n.id,
      createdAt: n.created_at,
      title: n.title,
      slug: n.slug,
      description: n.description,
      author: n.author,
      coverImageUrl: n.cover_image_url ?? null,
      translatorUsername: n.translator?.username ?? null,
      isAuthorNameCustom: n.is_author_name_custom ?? false,
      authorProfileUsername: n.authorProfile?.username ?? null,
    }));

    const baseUrl = new URL(request.url).origin;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const xml = generateNovelFeedXML(latestNovels as unknown as any[], baseUrl);

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