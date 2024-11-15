import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    
    if (code) {
      const supabase = createRouteHandlerClient({ cookies });
      const { data: { user }, error: authError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (authError) throw authError;
      
      if (user) {
        // First create the profile
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: `user_${Math.random().toString(36).slice(2, 7)}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Profile creation failed:', insertError);
        }
      }
    }

    return NextResponse.redirect(requestUrl.origin);
  } catch (error) {
    console.error('Callback error:', error);
    const requestUrl = new URL(request.url);
    return NextResponse.redirect(`${requestUrl.origin}/auth?error=callback_error`);
  }
} 