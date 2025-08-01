import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim().toLowerCase() || '';
    
    // Create Supabase client
    const supabase = createServerClient();
    
    // Fetch profile data from Supabase
    let queryBuilder = supabase.from('profiles')
      .select('username, role')
      .in('role', ['AUTHOR', 'TRANSLATOR'])
      .order('username', { ascending: true })
      .limit(50);
    
    // Add search filter if query exists
    if (query) {
      queryBuilder = queryBuilder.ilike('username', `%${query}%`);
    }
    
    // Execute the query
    const { data, error } = await queryBuilder;
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    if (!data) {
      return NextResponse.json([]);
    }
    
    return NextResponse.json(data.map(user => ({
      username: user.username,
      role: user.role
    })));
  } catch (error) {
    console.error('Error fetching authors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch authors' },
      { status: 500 }
    );
  }
} 