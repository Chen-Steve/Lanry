import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma, NovelStatus } from '@prisma/client';
import { type NextRequest } from 'next/server';

const ITEMS_PER_PAGE = 6;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.trim();
    const author = searchParams.get('author')?.trim();
    const tags = searchParams.getAll('tags');
    const status = searchParams.get('status') as NovelStatus | null;
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * ITEMS_PER_PAGE;

    // Build the where clause
    let where: Prisma.NovelWhereInput = {};

    // Optimize search query based on the search term
    if (query) {
      where = {
        ...where,
        title: {
          contains: query,
          mode: Prisma.QueryMode.insensitive
        }
      };
    }

    // Add author search if author exists
    if (author) {
      const user = await prisma.profile.findUnique({
        where: {
          username: author.toLowerCase()
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

    // Optimize tag filtering
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

    // Add status filtering
    if (status) {
      where = {
        ...where,
        status
      };
    }

    // Get total count for pagination using optimized count query
    const totalCount = await prisma.novel.count({
      where
    });

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    // Optimize the main search query
    const novels = await prisma.novel.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        coverImageUrl: true,
        status: true,
        updatedAt: true,
        bookmarkCount: true,
        author: true,
        authorProfile: {
          select: {
            username: true
          }
        },
        _count: {
          select: {
            chapters: true
          }
        }
      },
      take: ITEMS_PER_PAGE,
      skip,
      orderBy: [
        { bookmarkCount: 'desc' },
        { updatedAt: 'desc' }
      ]
    });

    // Fetch tags in a separate query for better performance
    const novelIds = novels.map(novel => novel.id);
    const tagsMap = new Map();
    
    if (novelIds.length > 0) {
      const novelTags = await prisma.tagsOnNovels.findMany({
        where: {
          novelId: {
            in: novelIds
          }
        },
        select: {
          novelId: true,
          tag: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // Group tags by novel ID
      novelTags.forEach(({ novelId, tag }) => {
        if (!tagsMap.has(novelId)) {
          tagsMap.set(novelId, []);
        }
        tagsMap.get(novelId).push(tag);
      });
    }

    // Optimize response transformation
    const transformedNovels = novels.map(novel => ({
      id: novel.id,
      title: novel.title,
      slug: novel.slug,
      coverImageUrl: novel.coverImageUrl,
      status: novel.status,
      updatedAt: novel.updatedAt,
      bookmarkCount: novel.bookmarkCount,
      author: novel.authorProfile?.username || novel.author,
      tags: tagsMap.get(novel.id) || [],
      chapterCount: novel._count.chapters
    }));

    return NextResponse.json({
      novels: transformedNovels,
      totalPages,
      totalCount
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to search novels', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 