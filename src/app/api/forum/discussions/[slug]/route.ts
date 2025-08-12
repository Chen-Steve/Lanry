import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseServer'

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('forum_discussions')
      .select('*')
      .eq('slug', params.slug)
      .single()

    if (error) throw error

    if (!data) {
      return new NextResponse('Discussion not found', { status: 404 })
    }

    const discussion = {
      id: data.id,
      title: data.title,
      slug: data.slug,
      description: data.description,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      isPinned: data.is_pinned,
      isLocked: data.is_locked,
      viewCount: data.view_count ?? 0,
      threads: []
    }

    return NextResponse.json(discussion)
  } catch (error) {
    console.error('[FORUM_DISCUSSION_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 