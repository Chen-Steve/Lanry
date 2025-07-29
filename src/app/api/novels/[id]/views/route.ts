import { NextResponse } from "next/server";
import supabaseAdmin from '@/lib/supabaseAdmin';

/**
 * Novel views endpoint - Database-based view tracking.
 * Uses a Postgres function to atomically increment views and create log entry.
 * This provides better performance by reducing network calls and ensuring atomicity.
 */
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    const { data, error } = await supabaseAdmin
      .rpc('increment_novel_views', { novel_id_param: id });

    if (error) {
      console.error('[INCREMENT_VIEWS_ERROR]', error);
      return NextResponse.json({ error: 'Failed to increment views' }, { status: 500 });
    }

    return NextResponse.json({ views: data });
  } catch (error) {
    console.error('Failed to increment views:', error);
    return NextResponse.json({ error: 'Failed to increment views' }, { status: 500 });
  }
} 