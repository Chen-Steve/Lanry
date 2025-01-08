import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

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
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { tagIds } = await request.json();
    
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
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
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
  } catch (error) {
    console.error('Error removing tag:', error);
    return NextResponse.json(
      { error: 'Failed to remove tag' },
      { status: 500 }
    );
  }
} 