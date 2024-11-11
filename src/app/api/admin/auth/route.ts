import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      email: username,
      password: password,
    });

    if (error) {
      console.error('Auth error:', error);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    console.log('User data:', data.user);
    console.log('User metadata:', data.user?.user_metadata);

    if (data.user?.user_metadata?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Not an admin user' },
        { status: 403 }
      );
    }

    return NextResponse.json({ 
      success: true,
      session: data.session 
    });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 