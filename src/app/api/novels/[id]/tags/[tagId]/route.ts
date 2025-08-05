import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

// DELETE /api/novels/[id]/tags/[tagId]
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; tagId: string } }
) {
  try {
    const supabase = await createServerClient();

    // Idempotent delete – succeeds whether a row existed or not
    const { error: deleteError } = await supabase
      .from('tags_on_novels')
      .delete()
      .eq('novel_id', params.id)
      .eq('tag_id', params.tagId);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing tag:', error);
    return NextResponse.json(
      { error: 'Failed to remove tag' },
      { status: 500 }
    );
  }
}