import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
    return NextResponse.json({ error: 'Google OAuth environment variables are not set.' }, { status: 500 });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );

  const scopes = [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/drive.metadata.readonly',
    'https://www.googleapis.com/auth/drive.file',
    'openid',
    'email',
    'profile',
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // ensures we get a refresh token on first consent
    prompt: 'consent',      // forces consent screen every time – good for dev; remove in prod if desired
    scope: scopes,
  });

  return NextResponse.redirect(authUrl);
} 