import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const topNovels = await prisma.novel.findMany({
      take: 5,
      orderBy: {
        views: 'desc'
      },
      include: {
        categories: {
          include: {
            category: true
          }
        },
        authorProfile: {
          select: {
            username: true
          }
        }
      }
    });

    // Transform the response to include flat category array and author username
    const transformedNovels = topNovels.map(novel => ({
      ...novel,
      author: novel.authorProfile?.username || novel.author,
      categories: novel.categories.map(c => c.category),
      authorProfile: undefined
    }));

    return NextResponse.json(transformedNovels);
  } catch (error) {
    console.error('Error fetching top novels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top novels' },
      { status: 500 }
    );
  }
} 