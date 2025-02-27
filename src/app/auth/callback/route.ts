import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Exchange code for session
    const { data: { session }, error: authError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (authError) {
      console.error('[Auth Callback] Error exchanging code for session:', authError);
      return NextResponse.redirect(new URL('/auth?error=auth_error', requestUrl.origin));
    }

    if (session?.user) {
      // Check if profile exists
      const { error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .single();

      // Only create profile for OAuth providers (Google, Discord, etc.)
      // Email signup is handled in useAuth.ts
      if (profileError && profileError.code === 'PGRST116' && session.user.app_metadata.provider) {
        // Create profile if it doesn't exist
        const { error: createError } = await supabase
          .from('profiles')
          .insert([{
            id: session.user.id,
            username: session.user.email?.split('@')[0] || `user_${Math.random().toString(36).slice(2, 7)}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            current_streak: 0,
            role: 'USER',
            coins: 0
          }]);

        if (createError) {
          console.error('[Auth Callback] Error creating profile:', createError);
          return NextResponse.redirect(new URL('/auth?error=profile_creation_failed', requestUrl.origin));
        }

        // Create reading time record
        const { error: readingTimeError } = await supabase
          .from('reading_time')
          .insert([{
            profile_id: session.user.id,
            total_minutes: 0
          }]);

        if (readingTimeError) {
          console.error('[Auth Callback] Error creating reading time:', readingTimeError);
        }
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL('/', requestUrl.origin));
} 