import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

// GET /api/novels/[id]/tags
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('tags_on_novels')
      .select('tag:tag_id (*)')
      .eq('novel_id', params.id);

    if (error) {
      throw error;
    }

    const tags = (data || []).map((row: { tag: unknown }) => row.tag);
    return NextResponse.json(tags);
  } catch (error) {
    console.error('Error fetching novel tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch novel tags' },
      { status: 500 }
    );
  }
}

// POST /api/novels/[id]/tags
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();

    // Bearer token auth check
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { tagIds } = await request.json();
    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      return NextResponse.json(
        { error: 'Tag IDs are required' },
        { status: 400 }
      );
    }

    const rows = tagIds.map((tagId: string) => ({
      novel_id: params.id,
      tag_id: tagId,
    }));

    const { error: insertError } = await supabase
      .from('tags_on_novels')
      .upsert(rows, { onConflict: 'novel_id,tag_id' });

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding tags:', error);
    return NextResponse.json(
      { error: 'Failed to add tags' },
      { status: 500 }
    );
  }
}