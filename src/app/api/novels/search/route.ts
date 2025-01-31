import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma, NovelStatus } from '@prisma/client';

const ITEMS_PER_PAGE = 6;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const author = searchParams.get('author');
    const tags = searchParams.getAll('tags');
    const status = searchParams.get('status') as NovelStatus | null;
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * ITEMS_PER_PAGE;

    // Build the where clause
    let where: Prisma.NovelWhereInput = {
      // Add any default filters here if needed
      // For example, only published novels
      // published: true,
    };

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
        return NextResponse.json({ novels: [], totalPages: 0 });
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
        { updatedAt: 'desc' }, // Show newest novels first
        { bookmarkCount: 'desc' } // Then by popularity
      ]
    });

    // Transform the response to include flat tag array and author username
    const transformedNovels = novels.map(novel => ({
      ...novel,
      author: novel.authorProfile?.username || novel.author,
      tags: novel.tags.map(t => t.tag),
      authorProfile: undefined // Remove the authorProfile object from the response
    }));

    return NextResponse.json({
      novels: transformedNovels,
      totalPages
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search novels' },
      { status: 500 }
    );
  }
} 