import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabaseServer";

type ProfileRow = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  role: 'USER' | 'AUTHOR' | 'TRANSLATOR';
};

type DBCommentRow = {
  id: string;
  content: string;
  created_at: string;
  updated_at: string | null;
  profile: ProfileRow | null;
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; chapterId: string } }
) {
  try {
    const supabase = await createServerClient();

    // Ensure the chapter belongs to the specified novel
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select('id, novel_id')
      .eq('id', params.chapterId)
      .single();

    if (chapterError || !chapter || chapter.novel_id !== params.id) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('chapter_thread_comments')
      .select(`
        id,
        content,
        created_at,
        updated_at,
        profile:profiles (
          id,
          username,
          avatar_url,
          role
        )
      `)
      .eq('chapter_id', params.chapterId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const rows = (data || []) as unknown as DBCommentRow[];
    const comments = rows.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      profile: c.profile
        ? {
            id: c.profile.id,
            username: c.profile.username,
            avatarUrl: c.profile.avatar_url,
            role: c.profile.role,
          }
        : null,
    }));

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching chapter comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; chapterId: string } }
) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const { content } = await request.json();

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

    // Verify chapter belongs to novel
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select('id, novel_id')
      .eq('id', params.chapterId)
      .single();

    if (chapterError || !chapter || chapter.novel_id !== params.id) {
      return NextResponse.json(
        { error: "Chapter not found" },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from('chapter_thread_comments')
      .insert({
        content: content.trim(),
        chapter_id: params.chapterId,
        profile_id: session.user.id,
      })
      .select(`
        id,
        content,
        created_at,
        updated_at,
        profile:profiles (
          id,
          username,
          avatar_url,
          role
        )
      `)
      .single();

    if (error) throw error;

    const row = data as unknown as DBCommentRow | null;
    const comment = row
      ? {
          id: row.id,
          content: row.content,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          profile: row.profile
            ? {
                id: row.profile.id,
                username: row.profile.username,
                avatarUrl: row.profile.avatar_url,
                role: row.profile.role,
              }
            : null,
        }
      : null;

    return NextResponse.json(comment);
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; chapterId: string } }
) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json(
        { error: "Comment ID is required" },
        { status: 400 }
      );
    }
    // Fetch comment to verify ownership and novel relationship
    const { data: commentRow, error: commentError } = await supabase
      .from('chapter_thread_comments')
      .select('id, profile_id, chapter_id')
      .eq('id', commentId)
      .single();

    if (commentError || !commentRow) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Fetch chapter to ensure it belongs to the specified novel
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select('id, novel_id')
      .eq('id', commentRow.chapter_id)
      .single();

    if (chapterError || !chapter || chapter.novel_id !== params.id) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Fetch novel to get author_profile_id
    const { data: novel, error: novelError } = await supabase
      .from('novels')
      .select('id, author_profile_id')
      .eq('id', chapter.novel_id)
      .single();

    if (novelError || !novel) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Only allow comment owner or novel author to delete
    if (
      commentRow.profile_id !== session.user.id &&
      novel.author_profile_id !== session.user.id
    ) {
      return NextResponse.json(
        { error: "Not authorized to delete this comment" },
        { status: 403 }
      );
    }

    const { error: deleteError } = await supabase
      .from('chapter_thread_comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
} 