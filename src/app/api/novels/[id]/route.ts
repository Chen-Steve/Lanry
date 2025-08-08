import { NextResponse } from 'next/server';
import { generateNovelSlug } from '@/lib/utils';
import { createServerClient } from '@/lib/supabaseServer';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    const { data: novel, error } = await supabase
      .from('novels')
      .select(`
        id,
        title,
        author,
        description,
        cover_image_url,
        status,
        created_at,
        updated_at,
        author_profile_id,
        bookmark_count,
        chapters (
          id,
          title,
          created_at
        )
      `)
      .eq('id', params.id)
      .order('created_at', { foreignTable: 'chapters', ascending: false })
      .limit(3, { foreignTable: 'chapters' })
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116: No rows found - treat below
      throw error;
    }

    if (!novel) {
      return NextResponse.json(null, { status: 404 });
    }

    // Check if the novel is a draft and if the user has access
    if (novel.status === 'DRAFT') {
      if (!session?.user || session.user.id !== novel.author_profile_id) {
        return NextResponse.json(null, { status: 404 });
      }
    }

    return NextResponse.json({
      id: novel.id,
      title: novel.title,
      author: novel.author,
      description: novel.description,
      coverImageUrl: novel.cover_image_url ?? undefined,
      status: novel.status,
      createdAt: novel.created_at,
      updatedAt: novel.updated_at,
      authorProfileId: novel.author_profile_id,
      chapters: (novel.chapters || []).slice(0, 3).map((c: { id: string; title: string; created_at: string }) => ({
        id: c.id,
        title: c.title,
        createdAt: c.created_at,
      })),
      coverImage: novel.cover_image_url ?? undefined,
      bookmarks: novel.bookmark_count ?? 0,
    });
  } catch (error) {
    console.error('Error fetching novel:', error);
    return NextResponse.json(
      { error: 'Failed to fetch novel' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, author, description, status } = body;

    // Validate input
    if (!title || !author || !description || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate new slug from title
    const slug = generateNovelSlug(title);

    const supabase = await createServerClient();
    const { data: novel, error } = await supabase
      .from('novels')
      .update({
        title,
        author,
        description,
        status: String(status).toUpperCase(),
        slug,
      })
      .eq('id', params.id)
      .select(`
        id,
        title,
        author,
        description,
        cover_image_url,
        status,
        created_at,
        updated_at,
        author_profile_id,
        bookmark_count
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({
      id: novel.id,
      title: novel.title,
      author: novel.author,
      description: novel.description,
      coverImageUrl: novel.cover_image_url ?? undefined,
      status: novel.status,
      createdAt: novel.created_at,
      updatedAt: novel.updated_at,
      authorProfileId: novel.author_profile_id,
      coverImage: novel.cover_image_url ?? undefined,
      bookmarks: novel.bookmark_count ?? 0,
    });
  } catch (error) {
    console.error('Error updating novel:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    const { error } = await supabase
      .from('novels')
      .delete()
      .eq('id', params.id);

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Novel not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json(
      { message: 'Novel deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting novel:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 