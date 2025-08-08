import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export async function GET() {
  // Initialize shared Supabase server client
  const supabase = await createServerClient();

  // Attempt to fetch the currently authenticated user (null if anonymous)
  const {
    data: { user }
  } = await supabase.auth.getUser();

  try {
    let excludeNovelIds: string[] = [];

    if (user) {
      const profileId = user.id;

      // Fetch novel IDs the user has bookmarked
      const [{ data: bookmarked, error: bookmarkErr }, { data: unlocked, error: unlockErr }] = await Promise.all([
        supabase
          .from('bookmarks')
          .select('novel_id')
          .eq('profile_id', profileId),
        supabase
          .from('chapter_unlocks')
          .select('novel_id')
          .eq('profile_id', profileId)
      ]);

      if (bookmarkErr || unlockErr) {
        console.error('Supabase error fetching user read history', bookmarkErr || unlockErr);
        return NextResponse.json(
          { error: 'Failed to fetch user history' },
          { status: 500 }
        );
      }

      excludeNovelIds = Array.from(
        new Set([
          ...(bookmarked ?? []).map((b: { novel_id: string }) => b.novel_id),
          ...(unlocked ?? []).map((u: { novel_id: string }) => u.novel_id)
        ])
      );
    }

    // Build base query for novels
    let novelsQuery = supabase
      .from('novels')
      .select('id', { count: 'exact', head: true })
      .neq('status', 'DRAFT');

    if (excludeNovelIds.length > 0) {
      novelsQuery = novelsQuery.not('id', 'in', `(${excludeNovelIds.join(',')})`);
    }

    // Get the total count first (no rows returned)
    const { count, error: countErr } = await novelsQuery;

    if (countErr) {
      console.error('Supabase error counting novels', countErr);
      return NextResponse.json({ error: 'Failed to count novels' }, { status: 500 });
    }

    if (!count || count === 0) {
      return NextResponse.json(
        { error: 'No unread novels found' },
        { status: 404 }
      );
    }

    // Skip a random number of novels
    const skip = Math.floor(Math.random() * count);

    // Fetch one novel slug using the calculated offset
    let randomQuery = supabase
      .from('novels')
      .select('slug')
      .neq('status', 'DRAFT');

    if (excludeNovelIds.length > 0) {
      randomQuery = randomQuery.not('id', 'in', `(${excludeNovelIds.join(',')})`);
    }

    const { data: novelRows, error: novelErr } = await randomQuery
      .order('id')
      .range(skip, skip);

    if (novelErr) {
      console.error('Supabase error fetching random novel', novelErr);
      return NextResponse.json({ error: 'Failed to fetch random novel' }, { status: 500 });
    }

    const novel = novelRows?.[0];

    if (!novel) {
      return NextResponse.json(
        { error: 'No novels found' },
        { status: 404 }
      );
    }

    // Return just the slug directly
    return NextResponse.json({ slug: novel.slug });
  } catch (error) {
    console.error('Error fetching random novel:', error);
    return NextResponse.json(
      { error: 'Failed to fetch random novel' },
      { status: 500 }
    );
  }
} 