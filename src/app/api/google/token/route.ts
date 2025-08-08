import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getDriveClient } from '@/lib/googleDrive';

export async function GET(request: NextRequest) {
  const res = NextResponse.next();
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
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401, headers: res.headers });
  }

  try {
    const drive = await getDriveClient(user.id);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore accessing internal googleapis property
    const accessToken = drive.context._options.auth.credentials?.access_token as string | undefined;
    return NextResponse.json({ access_token: accessToken }, { headers: res.headers });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || 'Failed' }, { status: 500, headers: res.headers });
  }
} 