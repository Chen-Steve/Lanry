import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(
  request: Request,
  { params }: { params: { novelId: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return new NextResponse('User ID is required', { status: 400 });
    }

    const novel = await prisma.novel.findFirst({
      where: {
        id: params.novelId,
        authorProfileId: userId,
      },
      select: {
        autoScheduleEnabled: true,
        autoScheduleInterval: true,
        autoScheduleTime: true,
      },
    });

    if (!novel) {
      return new NextResponse('Novel not found', { status: 404 });
    }

    return NextResponse.json({
      enabled: novel.autoScheduleEnabled,
      interval: novel.autoScheduleInterval,
      scheduleTime: novel.autoScheduleTime,
    });
  } catch (error) {
    console.error('[NOVEL_AUTO_SCHEDULE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { novelId: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { userId, enabled, interval, scheduleTime } = await request.json();

    // Verify user owns the novel
    const novel = await prisma.novel.findFirst({
      where: {
        id: params.novelId,
        authorProfileId: userId,
      },
    });

    if (!novel) {
      return new NextResponse('Novel not found', { status: 404 });
    }

    // Update auto-schedule settings
    await prisma.novel.update({
      where: {
        id: params.novelId,
      },
      data: {
        autoScheduleEnabled: enabled,
        autoScheduleInterval: interval,
        autoScheduleTime: scheduleTime,
      },
    });

    return new NextResponse('Settings saved successfully', { status: 200 });
  } catch (error) {
    console.error('[NOVEL_AUTO_SCHEDULE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
} 