import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { UserProfile } from '@/types/database';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    
    if (code) {
      const supabase = createRouteHandlerClient({ cookies });
      const { data: { user }, error: authError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (authError) throw authError;
      
      if (user) {
        // Check if profile already exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        if (!existingProfile) {
          // Create new profile using your UserProfile type
          const newProfile: Partial<UserProfile> = {
            id: user.id,
            username: `user_${Math.random().toString(36).slice(2, 7)}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            current_streak: 0,
            last_visit: null,
            coins: 0
          };

          const { error: insertError } = await supabase
            .from('profiles')
            .insert(newProfile)
            .single();

          if (insertError) {
            console.error('Profile creation failed:', insertError);
          }
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