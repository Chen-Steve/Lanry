import { google } from 'googleapis';
import supabaseAdmin from '@/lib/supabaseAdmin';

if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
  throw new Error('Google OAuth environment variables are not set.');
}

const oauth2ClientTemplate = new google.auth.OAuth2(
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

export async function getDriveClient(userId: string) {
  // Fetch stored tokens
  const { data, error } = await supabaseAdmin
    .from('drive_accounts')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('No Google Drive account linked to this user.');

  const oauth2Client = oauth2ClientTemplate; // copy of credentials template
  oauth2Client.setCredentials({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expiry_date: new Date(data.expires_at).getTime(),
  });

  // Automatically refresh if token is expired or about to expire within 1 minute
  const expiresInMs = (oauth2Client.credentials.expiry_date ?? 0) - Date.now();
  if (expiresInMs < 60_000) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    const { access_token, refresh_token, expiry_date } = credentials;

    await supabaseAdmin
      .from('drive_accounts')
      .update({
        access_token,
        refresh_token: refresh_token || data.refresh_token, // sometimes undefined
        expires_at: new Date(expiry_date!).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
  }

  return google.drive({ version: 'v3', auth: oauth2Client });
} 