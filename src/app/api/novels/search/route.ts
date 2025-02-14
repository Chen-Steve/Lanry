import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma, NovelStatus } from '@prisma/client';
import { type NextRequest } from 'next/server';

const ITEMS_PER_PAGE = 6;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const author = searchParams.get('author');
    const tags = searchParams.getAll('tags');
    const status = searchParams.get('status') as NovelStatus | null;
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * ITEMS_PER_PAGE;

    // Build the where clause
    let where: Prisma.NovelWhereInput = {};

    // Add title search if query exists
    if (query?.trim()) {
      where = {
        ...where,
        OR: [
          { title: { contains: query.trim(), mode: 'insensitive' } },
          { description: { contains: query.trim(), mode: 'insensitive' } }
        ]
      };
    }

    // Add author search if author exists
    if (author?.trim()) {
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

    // Get total count for pagination
    const totalCount = await prisma.novel.count({ where });
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    // Get paginated novels
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
      take: ITEMS_PER_PAGE,
      skip,
      orderBy: [
        { updatedAt: 'desc' },
        { bookmarkCount: 'desc' }
      ]
    });

    // Transform the response to include flat tag array and author username
    const transformedNovels = novels.map(novel => ({
      ...novel,
      author: novel.authorProfile?.username || novel.author,
      tags: novel.tags.map(t => t.tag),
      authorProfile: undefined
    }));

    return NextResponse.json({
      novels: transformedNovels,
      totalPages
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search novels', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 