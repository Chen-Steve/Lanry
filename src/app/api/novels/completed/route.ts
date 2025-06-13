import { NextRequest, NextResponse } from 'next/server';
import { getCompletedNovels } from '@/services/novelService';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '35', 10);

  const data = await getCompletedNovels(page, limit);

  return NextResponse.json(data, {
    status: 200,
    headers: {
      'Cache-Control': `public, max-age=0, s-maxage=${60 * 60}`, // cache at edge (1 h)
    },
  });
} 