import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma, NovelStatus } from '@prisma/client';
import { type NextRequest } from 'next/server';
import { redis, CACHE_KEYS, CACHE_TTL } from '@/lib/redis';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ITEMS_PER_PAGE = 6;

type MinimalNovel = {
  id: string;
  title: string;
  slug: string;
  author: string | null;
  authorProfile: { username: string | null } | null;
};

type FullNovel = MinimalNovel & {
  coverImageUrl: string | null;
  status: NovelStatus;
  updatedAt: Date;
  _count: { chapters: number };
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim().toLowerCase() || '';
    const author = searchParams.get('author')?.trim();
    const tags = searchParams.getAll('tags');
    const status = searchParams.get('status') as NovelStatus | null;
    const categories = searchParams.getAll('categories');
    const page = parseInt(searchParams.get('page') || '1');
    const isBasicSearch = searchParams.get('basic') === 'true';
    
    const skip = (page - 1) * ITEMS_PER_PAGE;
    
    // Generate cache key
    const cacheKey = CACHE_KEYS.SEARCH(`${query}:${page}:${isBasicSearch}`);
    
    // Try to get from cache
    const cachedResult = await redis.get(cacheKey);
    if (cachedResult) {
      return NextResponse.json(cachedResult);
    }

    // Build the where clause
    let where: Prisma.NovelWhereInput = {
      AND: [
        {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { author: { contains: query, mode: 'insensitive' } }
          ]
        },
        { status: { not: 'DRAFT' } }
      ]
    };

    // Optimize search query based on the search term
    if (query) {
      if (isBasicSearch) {
        // For basic search, match only distinct words or parts
        where = {
          ...where,
          OR: [
            { title: { mode: 'insensitive', startsWith: query } },
            { title: { mode: 'insensitive', endsWith: query } },
            { title: { mode: 'insensitive', contains: ` ${query}` } },
            { title: { mode: 'insensitive', contains: `${query} ` } }
          ]
        };
      } else {
        // For advanced search, keep the flexible matching
        where = {
          ...where,
          title: {
            contains: query,
            mode: Prisma.QueryMode.insensitive
          }
        };
      }
    }

    // Add author search if author exists
    if (author) {
      where = {
        ...where,
        authorProfile: {
          username: {
            mode: 'insensitive',
            equals: author
          }
        }
      };
    }

    // Optimize tag filtering
    if (tags.length > 0) {
      where = {
        ...where,
        AND: tags.map(tagId => ({
          tags: {
            some: {
              tag: {
                id: tagId
              }
            }
          }
        }))
      };
    }

    // Add category filtering
    if (categories.length > 0) {
      const existingAnd = Array.isArray(where.AND) ? where.AND : [];
      const categoryConditions = categories.map(categoryId => ({
        categories: {
          some: {
            category: {
              id: categoryId
            }
          }
        }
      }));

      where = {
        ...where,
        AND: [...existingAnd, ...categoryConditions]
      };
    }

    // Add status filtering
    if (status) {
      // If user is specifically searching for a status, use that (but still exclude DRAFT unless explicitly searched for)
      if (status === 'DRAFT') {
        // Only allow DRAFT search if explicitly requested - this could be restricted further if needed
        where = {
          ...where,
          status: 'DRAFT'
        };
      } else {
        where = {
          ...where,
          status
        };
      }
    } else {
      // If no specific status filter, just maintain the existing DRAFT exclusion
      // (already set in the initial where clause)
    }

    // Get total count for pagination using optimized count query
    const totalCount = await prisma.novel.count({
      where
    });

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    // Optimize the main search query
    const novels = await prisma.novel.findMany({
      where,
      select: isBasicSearch ? {
        // Minimal select for basic search
        id: true,
        title: true,
        slug: true,
        author: true,
        authorProfile: {
          select: {
            username: true
          }
        }
      } : {
        id: true,
        title: true,
        slug: true,
        coverImageUrl: true,
        status: true,
        updatedAt: true,
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
        { updatedAt: 'desc' }
      ]
    });

    // Fetch tags only if needed
    const tagsMap = new Map();
    if (!isBasicSearch && novels.length > 0) {
      const novelIds = novels.map(novel => novel.id);
      
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
    }

    // Optimize response transformation
    const transformedNovels = novels.map(novel => {
      const baseNovel = {
        id: novel.id,
        title: novel.title,
        slug: novel.slug,
        author: novel.authorProfile?.username || novel.author,
      };

      if (!isBasicSearch) {
        const fullNovel = novel as FullNovel;
        return {
          ...baseNovel,
          coverImageUrl: fullNovel.coverImageUrl,
          status: fullNovel.status,
          updatedAt: fullNovel.updatedAt,
          tags: tagsMap.get(novel.id) || [],
          chapterCount: fullNovel._count.chapters
        };
      }

      return baseNovel;
    });

    const result = {
      novels: transformedNovels,
      totalPages,
      totalCount
    };

    // Cache the result
    await redis.set(cacheKey, result, {
      ex: CACHE_TTL.SEARCH
    });

    return NextResponse.json(result);
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