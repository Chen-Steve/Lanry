import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseServer'
import { randomUUID } from 'crypto'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const threadId = searchParams.get('threadId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    if (!threadId) {
      return new NextResponse('Thread ID is required', { status: 400 })
    }

    const supabase = await createServerClient()

    const { data: messageRows, error: listError } = await supabase
      .from('forum_messages')
      .select(`
        *,
        author:profiles (
          id,
          username,
          avatar_url,
          role
        )
      `)
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
      .range(skip, skip + limit - 1)

    if (listError) throw listError

    const { count: total, error: countError } = await supabase
      .from('forum_messages')
      .select('*', { count: 'exact', head: true })
      .eq('thread_id', threadId)

    if (countError) throw countError

    type MessageRow = {
      id: string
      content: string
      created_at: string
      updated_at: string
      thread_id: string
      author_id: string
      is_edited: boolean
      author?: { id: string; username: string; avatar_url: string | null } | null
    }

    const totalExact = total ?? 0

    return NextResponse.json({
      messages: (messageRows || []).map((m: MessageRow) => ({
        id: m.id,
        content: m.content,
        created_at: m.created_at,
        updated_at: m.updated_at,
        thread_id: m.thread_id,
        author_id: m.author_id,
        is_edited: m.is_edited,
        author: {
          id: m.author?.id,
          username: m.author?.username,
          avatar_url: m.author?.avatar_url ?? null,
        }
      })),
      total: totalExact,
      pages: Math.ceil(totalExact / limit)
    })
  } catch (error) {
    console.error('[FORUM_MESSAGES_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { content, threadId } = body

    if (!content || !threadId) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const { data: thread, error: threadError } = await supabase
      .from('forum_threads')
      .select('*, discussion:forum_discussions(*)')
      .eq('id', threadId)
      .single()

    if (threadError) throw threadError

    if (!thread) {
      return new NextResponse('Thread not found', { status: 404 })
    }

    if (thread.is_locked || thread.discussion?.is_locked) {
      return new NextResponse('Thread is locked', { status: 403 })
    }

    const now = new Date().toISOString()
    const { data: message, error: createError } = await supabase
      .from('forum_messages')
      .insert([{
        id: randomUUID(),
        content,
        thread_id: threadId,
        author_id: user.id,
        created_at: now,
        updated_at: now
      }])
      .select(`
        *,
        author:profiles (
          id,
          username,
          avatar_url,
          role
        )
      `)
      .single()

    if (createError) throw createError

    const { error: updateError } = await supabase
      .from('forum_threads')
      .update({ last_message_at: now })
      .eq('id', threadId)

    if (updateError) throw updateError

    return NextResponse.json({
      id: message.id,
      content: message.content,
      created_at: message.created_at,
      updated_at: message.updated_at,
      thread_id: message.thread_id,
      author_id: message.author_id,
      is_edited: message.is_edited,
      author: {
        id: message.author?.id,
        username: message.author?.username,
        avatar_url: message.author?.avatar_url ?? null,
        role: message.author?.role
      }
    })
  } catch (error) {
    console.error('[FORUM_MESSAGES_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const messageId = searchParams.get('messageId')

    if (!messageId) {
      return new NextResponse('Message ID is required', { status: 400 })
    }

    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Find the message and check ownership
    const { data: message, error: messageError } = await supabase
      .from('forum_messages')
      .select('id, author_id, thread_id, created_at')
      .eq('id', messageId)
      .single()

    if (messageError) throw messageError

    if (!message) {
      return new NextResponse('Message not found', { status: 404 })
    }

    // Check if user is the message author
    if (message.author_id !== user.id) {
      return new NextResponse('Not authorized to delete this message', { status: 403 })
    }

    // Delete the message
    const { error: deleteError } = await supabase
      .from('forum_messages')
      .delete()
      .eq('id', messageId)

    if (deleteError) throw deleteError

    // Update thread's lastMessageAt to the most recent remaining message
    const { data: lastMessage } = await supabase
      .from('forum_messages')
      .select('*')
      .eq('thread_id', message.thread_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (lastMessage) {
      await supabase
        .from('forum_threads')
        .update({ last_message_at: lastMessage.created_at })
        .eq('id', message.thread_id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[FORUM_MESSAGE_DELETE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 

export async function PATCH(req: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { id, content } = body as { id?: string; content?: string }

    if (!id || !content || content.trim().length === 0) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const now = new Date().toISOString()

    // Ensure ownership
    const { data: existing, error: fetchError } = await supabase
      .from('forum_messages')
      .select('id, author_id, thread_id')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError
    if (!existing) {
      return new NextResponse('Message not found', { status: 404 })
    }
    if (existing.author_id !== user.id) {
      return new NextResponse('Not authorized to edit this message', { status: 403 })
    }

    const { data: message, error: updateError } = await supabase
      .from('forum_messages')
      .update({
        content: content.trim(),
        updated_at: now,
        is_edited: true
      })
      .eq('id', id)
      .select(`
        *,
        author:profiles (
          id,
          username,
          avatar_url,
          role
        )
      `)
      .single()

    if (updateError) throw updateError

    return NextResponse.json({
      id: message.id,
      content: message.content,
      created_at: message.created_at,
      updated_at: message.updated_at,
      thread_id: message.thread_id,
      author_id: message.author_id,
      is_edited: message.is_edited,
      author: {
        id: message.author?.id,
        username: message.author?.username,
        avatar_url: message.author?.avatar_url ?? null,
        role: message.author?.role
      }
    })
  } catch (error) {
    console.error('[FORUM_MESSAGE_PATCH]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}