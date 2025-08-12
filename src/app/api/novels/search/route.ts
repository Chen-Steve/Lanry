import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ITEMS_PER_PAGE = 6;

type NovelStatus = 'ONGOING' | 'COMPLETED' | 'HIATUS' | 'DROPPED' | 'DRAFT';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);

    const queryRaw = searchParams.get('q')?.trim() || '';
    const query = queryRaw;
    const tls = searchParams.getAll('tls');
    const tagIds = searchParams.getAll('tags');
    const status = (searchParams.get('status') as NovelStatus | null) || null;
    const categoryIds = searchParams.getAll('categories');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const isBasicSearch = searchParams.get('basic') === 'true';

    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    // Resolve TL filter to author_profile_id list (OR semantics across provided usernames)
    let tlProfileIds: string[] | null = null;
    if (tls.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('username', tls);
      tlProfileIds = (profiles || []).map((p: { id: string }) => p.id);
      if (tlProfileIds.length === 0) {
        return NextResponse.json({ novels: [], totalPages: 0, totalCount: 0 });
      }
    }

    // Resolve tag filters to novel_id set (AND semantics across all provided tags)
    let tagFilteredNovelIds: string[] | null = null;
    if (tagIds.length > 0) {
      for (const tagId of tagIds) {
        const { data: rows } = await supabase
          .from('tags_on_novels')
          .select('novel_id')
          .eq('tag_id', tagId);
        const currentIds = new Set((rows || []).map((r: { novel_id: string }) => r.novel_id));
        if (tagFilteredNovelIds === null) {
          tagFilteredNovelIds = Array.from(currentIds);
        } else {
          tagFilteredNovelIds = tagFilteredNovelIds.filter(id => currentIds.has(id));
        }
        if ((tagFilteredNovelIds || []).length === 0) {
          return NextResponse.json({ novels: [], totalPages: 0, totalCount: 0 });
        }
      }
    }

    // Resolve category filters to novel_id set (AND semantics)
    let categoryFilteredNovelIds: string[] | null = null;
    if (categoryIds.length > 0) {
      for (const categoryId of categoryIds) {
        const { data: rows } = await supabase
          .from('categories_on_novels')
          .select('novel_id')
          .eq('category_id', categoryId);
        const currentIds = new Set((rows || []).map((r: { novel_id: string }) => r.novel_id));
        if (categoryFilteredNovelIds === null) {
          categoryFilteredNovelIds = Array.from(currentIds);
        } else {
          categoryFilteredNovelIds = categoryFilteredNovelIds.filter(id => currentIds.has(id));
        }
        if ((categoryFilteredNovelIds || []).length === 0) {
          return NextResponse.json({ novels: [], totalPages: 0, totalCount: 0 });
        }
      }
    }

    // Combine tag/category constraints (intersection if both present)
    let constrainedNovelIds: string[] | null = null;
    if (tagFilteredNovelIds && categoryFilteredNovelIds) {
      const setB = new Set(categoryFilteredNovelIds);
      constrainedNovelIds = tagFilteredNovelIds.filter(id => setB.has(id));
    } else {
      constrainedNovelIds = tagFilteredNovelIds ?? categoryFilteredNovelIds;
    }
    if (constrainedNovelIds && constrainedNovelIds.length === 0) {
      return NextResponse.json({ novels: [], totalPages: 0, totalCount: 0 });
    }

    // Helper to apply all filters to a query builder
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const applyFilters = (qb: any) => {
      let queryBuilder = qb;

      // Status filter: exclude DRAFT by default
      if (status) {
        queryBuilder = queryBuilder.eq('status', status);
      } else {
        queryBuilder = queryBuilder.neq('status', 'DRAFT');
      }

      // Title/description/author query
      if (query) {
        if (isBasicSearch) {
          // Basic: match across title, description, author
          const like = `%${query}%`;
          queryBuilder = queryBuilder.or(
            `title.ilike.${like},description.ilike.${like},author.ilike.${like}`
          );
        } else {
          // Advanced: focus on title contains
          const like = `%${query}%`;
          queryBuilder = queryBuilder.ilike('title', like);
        }
      }

      // TL usernames -> author_profile_id IN (...)
      if (tlProfileIds && tlProfileIds.length > 0) {
        queryBuilder = queryBuilder.in('author_profile_id', tlProfileIds);
      }

      // Tag/category constraints as novel id inclusion
      if (constrainedNovelIds && constrainedNovelIds.length > 0) {
        queryBuilder = queryBuilder.in('id', constrainedNovelIds);
      }

      // Sort by title asc
      queryBuilder = queryBuilder.order('title', { ascending: true });

      return queryBuilder;
    };

    // Count query (head request for exact count)
    {
      const { count, error: countError } = await applyFilters(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        supabase.from('novels').select('id', { count: 'exact', head: true })
      );
      if (countError) {
        throw countError;
      }
      const totalCount = count ?? 0;
      const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

      // If no results, short-circuit
      if (totalCount === 0) {
        return NextResponse.json({ novels: [], totalPages, totalCount });
      }

      // Data query
      const baseSelectMinimal = 'id,title,slug,author,author_profile_id,authorProfile:author_profile_id(username)';
      const baseSelectFull = `${baseSelectMinimal},cover_image_url,status,updated_at,chapters(id)`;
      const selectColumns = isBasicSearch ? baseSelectMinimal : baseSelectFull;

      const { data: novels, error: novelsError } = await applyFilters(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        supabase
          .from('novels')
          .select(selectColumns)
          .range(from, to)
      );

      if (novelsError) {
        throw novelsError;
      }

      const novelsArray = (novels || []) as Array<
        {
          id: string;
          title: string;
          slug: string;
          author: string | null;
          authorProfile?: { username: string | null } | null;
        } & {
          cover_image_url?: string | null;
          status?: NovelStatus;
          updated_at?: string;
          chapters?: Array<{ id: string }>;
        }
      >;
      const novelIds = novelsArray.map(n => n.id);

      // Fetch tags for these novels if full search
      const tagsMap = new Map<string, Array<{ id: string; name: string }>>();
      if (!isBasicSearch && novelIds.length > 0) {
        const { data: tagRows, error: tagsError } = await supabase
          .from('tags_on_novels')
          .select('novel_id, tag:tag_id (id, name)')
          .in('novel_id', novelIds);
        if (tagsError) throw tagsError;
        (tagRows as unknown as Array<{ novel_id: string; tag: { id: string; name: string } }> | null || []).forEach((row) => {
          const list = tagsMap.get(row.novel_id) || [];
          list.push(row.tag);
          tagsMap.set(row.novel_id, list);
        });
      }

      const transformedNovels = novelsArray.map(novel => {
        const base = {
          id: novel.id,
          title: novel.title,
          slug: novel.slug,
          author: novel.authorProfile?.username ?? novel.author ?? null,
        };
        if (isBasicSearch) return base;
        return {
          ...base,
          coverImageUrl: novel.cover_image_url ?? null,
          status: novel.status as NovelStatus,
          updatedAt: novel.updated_at,
          tags: tagsMap.get(novel.id) || [],
          chapterCount: Array.isArray(novel.chapters) ? novel.chapters.length : 0,
        };
      });

      return NextResponse.json({ novels: transformedNovels, totalPages, totalCount });
    }
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