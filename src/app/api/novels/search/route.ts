import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma, NovelStatus } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const author = searchParams.get('author');
    const tags = searchParams.getAll('tags');
    const status = searchParams.get('status') as NovelStatus | null;

    // Build the where clause
    let where: Prisma.NovelWhereInput = {};

    // Add title search if query exists
    if (query?.trim()) {
      where = {
        ...where,
        title: { contains: query.trim(), mode: 'insensitive' }
      };
    }

    // Add author search if author exists
    if (author?.trim()) {
      // First find the user ID by username
      const user = await prisma.profile.findFirst({
        where: {
          username: {
            equals: author.trim(),
            mode: 'insensitive'
          }
        },
        select: {
          id: true
        }
      });

      if (user) {
        where = {
          ...where,
          authorProfileId: user.id
        };
      } else {
        // If no user found, return empty array
        return NextResponse.json([]);
      }
    }

    // Add tag filtering if tags exist
    if (tags.length > 0) {
      where = {
        ...where,
        tags: {
          some: {
            tagId: {
              in: tags
            }
          }
        }
      };
    }

    // Add status filtering if status exists
    if (status) {
      where = {
        ...where,
        status
      };
    }

    // If no search conditions are provided, return empty array
    if (!query?.trim() && !author?.trim() && tags.length === 0 && !status) {
      return NextResponse.json([]);
    }

    const novels = await prisma.novel.findMany({
      where,
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        authorProfile: {
          select: {
            username: true
          }
        }
      },
      take: 20,
      orderBy: {
        bookmarkCount: 'desc'
      }
    });

    // Transform the response to include flat tag array and author username
    const transformedNovels = novels.map(novel => ({
      ...novel,
      author: novel.authorProfile?.username || novel.author,
      tags: novel.tags.map(t => t.tag),
      authorProfile: undefined // Remove the authorProfile object from the response
    }));

    return NextResponse.json(transformedNovels);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search novels' },
      { status: 500 }
    );
  }
} 