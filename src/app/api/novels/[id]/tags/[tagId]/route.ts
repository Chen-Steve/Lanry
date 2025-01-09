import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Prisma } from '@prisma/client';

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
  } catch (err: unknown) {
    const error = err as Error;
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