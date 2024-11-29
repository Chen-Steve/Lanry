import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const category = await prisma.forumCategory.findUnique({
      where: {
        id: params.id
      },
      select: {
        id: true,
        name: true,
        description: true,
        thread_count: true,
        latest_thread: true,
        created_at: true,
      }
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...category,
      created_at: category.created_at.toISOString(),
      latest_thread: category.latest_thread?.toISOString()
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
} 