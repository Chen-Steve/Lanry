import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getDriveClient } from '@/lib/googleDrive';

export async function GET() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const drive = await getDriveClient(user.id);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore accessing internal googleapis property
    const accessToken = drive.context._options.auth.credentials?.access_token as string | undefined;
    return NextResponse.json({ access_token: accessToken });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || 'Failed' }, { status: 500 });
  }
} 