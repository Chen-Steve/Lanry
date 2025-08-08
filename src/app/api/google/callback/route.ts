export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  // Prepare a response instance to allow setting cookies across try/catch
  const res = NextResponse.next();

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

    // Get the currently logged-in user via Supabase SSR client.
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookies) {
            cookies.forEach(({ name, value, options }) => {
              res.cookies.set(name, value, options);
            });
          },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const origin = request.headers.get('origin') || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}`;
      return NextResponse.redirect(new URL('/auth', origin), { headers: res.headers });
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
      const upsertRes = await privileged
        .from('drive_accounts')
        .upsert({
          user_id: user.id,
          access_token,
          refresh_token,
          expires_at: new Date(expiry_date).toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      upsertError = upsertRes.error;
    }

    if (upsertError) {
      console.error(upsertError);
      return NextResponse.json({ error: 'Failed to save tokens.' }, { status: 500, headers: res.headers });
    }

    const origin = request.headers.get('origin') || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}`;
    return NextResponse.redirect(new URL('/author/dashboard?drive=connected', origin), { headers: res.headers });
  } catch (err) {
    console.error('Error exchanging Google OAuth code:', err);
    const origin = request.headers.get('origin') || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}`;
    return NextResponse.redirect(new URL('/author/dashboard?driveError=oauth', origin), { headers: res.headers });
  }
} 