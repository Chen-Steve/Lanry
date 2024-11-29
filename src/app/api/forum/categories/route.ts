import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const categories = await prisma.forumCategory.findMany({
      orderBy: {
        name: 'asc'
      },
      include: {
        _count: {
          select: {
            threads: true
          }
        },
        threads: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    return NextResponse.json(categories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      created_at: category.created_at.toISOString(),
      thread_count: category._count.threads,
      latest_thread: category.threads[0]?.createdAt.toISOString()
    })));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
} 