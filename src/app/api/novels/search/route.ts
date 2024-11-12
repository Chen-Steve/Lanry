import { NextResponse } from 'next/server';
import supabase from '@/lib/supabaseClient';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('novels')
      .select('*')
      .or(`title.ilike.%${query}%,author.ilike.%${query}%`)
      .limit(10);

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search novels' },
      { status: 500 }
    );
  }
} 