export const runtime = 'nodejs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    const origin = request.headers.get('origin') || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}`;
    return NextResponse.redirect(new URL(`/author/dashboard?driveError=${encodeURIComponent(error)}`, origin));
  }

  if (!code) {
    return NextResponse.json({ error: 'Missing code parameter.' }, { status: 400 });
  }

  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
    return NextResponse.json({ error: 'Google OAuth environment variables are not set.' }, { status: 500 });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    const { access_token, refresh_token, expiry_date } = tokens;

    // Get the currently logged-in user via Supabase auth helpers.
    const supabase = createServerComponentClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const origin = request.headers.get('origin') || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}`;
      return NextResponse.redirect(new URL('/auth', origin));
    }

    if (!access_token || !refresh_token || !expiry_date) {
      return NextResponse.json({ error: 'Incomplete tokens received from Google.' }, { status: 500 });
    }

    // Upsert into drive_accounts table using admin client
    let { error: upsertError } = await supabaseAdmin
      .from('drive_accounts')
      .upsert({
        user_id: user.id,
        access_token,
        refresh_token,
        expires_at: new Date(expiry_date).toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    // Fallback: if RLS blocks admin (unexpected), create direct client with service role key
    if (upsertError && upsertError.code === '42501' && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const privileged = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
      );
      const res = await privileged
        .from('drive_accounts')
        .upsert({
          user_id: user.id,
          access_token,
          refresh_token,
          expires_at: new Date(expiry_date).toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      upsertError = res.error;
    }

    if (upsertError) {
      console.error(upsertError);
      return NextResponse.json({ error: 'Failed to save tokens.' }, { status: 500 });
    }

    const origin = request.headers.get('origin') || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}`;
    return NextResponse.redirect(new URL('/author/dashboard?drive=connected', origin));
  } catch (err) {
    console.error('Error exchanging Google OAuth code:', err);
    const origin = request.headers.get('origin') || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}`;
    return NextResponse.redirect(new URL('/author/dashboard?driveError=oauth', origin));
  }
} 