import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create a Supabase client with the service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  request: Request,
  { params }: { params: { novelId: string } }
) {
  try {
    const { novelId } = params;
    console.log('Fetching comments for novel:', novelId);

    const { data, error } = await supabaseAdmin
      .from('novel_comments')
      .select(`
        id,
        content,
        created_at,
        profile_id,
        profiles (
          username
        )
      `)
      .eq('novel_id', novelId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { novelId: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({
      cookies: () => cookieStore,
    });
    const { novelId } = params;
    const { content } = await request.json();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('novel_comments')
      .insert([
        {
          novel_id: novelId,
          profile_id: session.user.id,
          content,
        },
      ])
      .select(`
        id,
        content,
        created_at,
        profile_id,
        profiles (
          username
        )
      `)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 