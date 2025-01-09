import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Prisma } from '@prisma/client';

// GET /api/novels/[id]/tags
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const tagsOnNovel = await prisma.tagsOnNovels.findMany({
      where: { novelId: params.id },
      include: { tag: true }
    });
    return NextResponse.json(tagsOnNovel.map(t => t.tag));
  } catch (error) {
    console.error('Error fetching novel tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch novel tags' },
      { status: 500 }
    );
  }
}

// POST /api/novels/[id]/tags
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { tagIds } = await request.json();
    
    if (!tagIds || !Array.isArray(tagIds) || tagIds.length === 0) {
      return NextResponse.json(
        { error: 'Tag IDs are required' },
        { status: 400 }
      );
    }

    const data = tagIds.map((tagId: string) => ({
      novelId: params.id,
      tagId
    }));

    await prisma.tagsOnNovels.createMany({
      data,
      skipDuplicates: true
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding tags:', error);
    return NextResponse.json(
      { error: 'Failed to add tags' },
      { status: 500 }
    );
  }
}

// DELETE /api/novels/[id]/tags/[tagId]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; tagId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await prisma.tagsOnNovels.delete({
      where: {
        novelId_tagId: {
          novelId: params.id,
          tagId: params.tagId
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error removing tag:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Tag not found on novel' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to remove tag' },
      { status: 500 }
    );
  }
} 