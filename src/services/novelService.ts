import { Novel, Chapter, ChapterUnlock, NovelCategory } from '@/types/database';
import supabase from '@/lib/supabaseClient';
import { generateUUID } from '@/lib/utils';

interface NovelCharacterFromDB {
  id: string;
  name: string;
  role: string;
  image_url: string;
  description: string | null;
  order_index: number;
}

interface GetNovelsOptions {
  limit?: number;
  offset?: number;
  categories?: {
    included: string[];
    excluded: string[];
  };
}

export async function getNovel(id: string, userId?: string): Promise<Novel | null> {
  try {
    const isNumericId = !isNaN(Number(id));
    const { data, error } = await supabase
      .from('novels')
      .select(`
        *,
        translator:author_profile_id (
          id,
          username,
          kofi_url,
          patreon_url,
          custom_url,
          custom_url_label,
          author_bio
        ),
        chapters (
          id,
          title,
          created_at,
          chapter_number,
          part_number,
          publish_at,
          coins,
          volume_id,
          age_rating
        ),
        volumes (
          id,
          title,
          volume_number,
          description
        ),
        bookmarks!left (
          id,
          profile_id
        ),
        chapter_unlocks!left (
          chapter_number,
          profile_id
        ),
        novel_ratings!left (
          rating,
          profile_id
        ),
        categories:categories_on_novels (
          category:category_id (
            id,
            name,
            created_at,
            updated_at
          )
        ),
        tags:tags_on_novels!left (
          novel_id,
          tag_id,
          created_at,
          tag:tag_id (
            id,
            name,
            description
          )
        ),
        characters:novel_characters (
          id,
          name,
          role,
          image_url,
          description,
          order_index
        )
      `)
      .eq(isNumericId ? 'id' : 'slug', isNumericId ? Number(id) : id)
      .single()
      .throwOnError();

    if (error || !data) return null;

    // Process chapters to include unlock status
    const chapters = (data.chapters || []).map((chapter: Chapter) => ({
      ...chapter,
      isUnlocked: userId ? 
        data.chapter_unlocks?.some((unlock: ChapterUnlock) => 
          unlock.chapter_number === chapter.chapter_number && 
          unlock.profile_id === userId
        ) : false
    })).sort((a: Chapter, b: Chapter) => a.chapter_number - b.chapter_number);

    // Calculate ratings
    const ratings = data.novel_ratings || [];
    const ratingCount = ratings.length;
    const averageRating = ratingCount > 0
      ? ratings.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / ratingCount
      : 0;

    // Get user's rating if they're logged in
    const userRating = userId && ratings.length > 0
      ? ratings.find((r: { profile_id: string; rating: number }) => r.profile_id === userId)?.rating
      : undefined;

    // Calculate bookmark count
    const bookmarkCount = data.bookmarks?.length || 0;

    // Process categories
    const categories = data.categories?.map((item: { category: NovelCategory }) => item.category) || [];

    // Process characters
    const characters = data.characters?.map((char: NovelCharacterFromDB) => ({
      id: char.id,
      name: char.name,
      role: char.role,
      imageUrl: char.image_url,
      description: char.description,
      orderIndex: char.order_index,
    })) || [];

    return {
      ...data,
      translator: data.translator ? {
        username: data.translator.username,
        profile_id: data.translator.id,
        kofiUrl: data.translator.kofi_url,
        patreonUrl: data.translator.patreon_url,
        customUrl: data.translator.custom_url,
        customUrlLabel: data.translator.custom_url_label,
        author_bio: data.translator.author_bio
      } : null,
      coverImageUrl: data.cover_image_url,
      isBookmarked: userId ? data.bookmarks?.some((b: { profile_id: string }) => b.profile_id === userId) : false,
      userRating,
      rating: averageRating,
      ratingCount,
      bookmarkCount,
      chapters,
      volumes: data.volumes || [],
      categories,
      tags: data.tags?.map((t: { tag: { id: string; name: string; description: string | null } }) => t.tag) || [],
      characters,
      ageRating: data.age_rating
    };
  } catch (error) {
    console.error('Error fetching novel:', error);
    return null;
  }
}

export async function toggleBookmark(novelId: string, userId: string, isCurrentlyBookmarked: boolean): Promise<boolean> {
  try {
    const isNumericId = !isNaN(Number(novelId));
    const { data: novelData, error: novelError } = await supabase
      .from('novels')
      .select('id, bookmark_count')
      .eq(isNumericId ? 'id' : 'slug', isNumericId ? Number(novelId) : novelId)
      .single();

    if (novelError || !novelData) {
      console.error('Error getting novel:', novelError);
      throw new Error('Novel not found');
    }

    if (isCurrentlyBookmarked) {
      // Delete bookmark
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('profile_id', userId)
        .eq('novel_id', novelData.id);

      if (error) throw error;

      // Update bookmark count
      await supabase
        .from('novels')
        .update({ 
          bookmark_count: Math.max(0, (novelData.bookmark_count || 0) - 1)
        })
        .eq('id', novelData.id);

      return false;
    } else {
      // Insert bookmark with UUID from our utility function
      const { error } = await supabase
        .from('bookmarks')
        .insert({
          id: generateUUID(),
          profile_id: userId,
          novel_id: novelData.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update bookmark count
      await supabase
        .from('novels')
        .update({ 
          bookmark_count: (novelData.bookmark_count || 0) + 1
        })
        .eq('id', novelData.id);

      return true;
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    throw error;
  }
}

export async function getNovels(options: GetNovelsOptions = {}): Promise<{ novels: Novel[]; total: number }> {
  try {
    const { limit = 24, offset = 0, categories } = options;
    
    console.log('Fetching novels with options:', { limit, offset, categories });
    
    // First get the latest chapter dates for each novel
    const { data: latestChapters } = await supabase
      .from('chapters')
      .select('novel_id, created_at, title')
      .order('created_at', { ascending: false });

    if (!latestChapters) {
      throw new Error('Failed to fetch latest chapters');
    }

    console.log('Latest 5 chapters:', latestChapters.slice(0, 5).map(ch => ({
      novel_id: ch.novel_id,
      title: ch.title,
      created_at: new Date(ch.created_at).toISOString(),
      created_at_local: new Date(ch.created_at).toLocaleString()
    })));

    // Get unique novel IDs ordered by their latest chapter date
    const orderedNovelIds = [...new Set(latestChapters.map(ch => ch.novel_id))];
    
    console.log('First 5 novel IDs in order:', orderedNovelIds.slice(0, 5));
    
    if (orderedNovelIds.length === 0) {
      console.log('No novels found with chapters');
      return { novels: [], total: 0 };
    }

    // Then fetch the full novel data in the correct order
    let query = supabase
      .from('novels')
      .select(`
        *,
        translator:author_profile_id (
          id,
          username,
          kofi_url,
          patreon_url,
          custom_url,
          custom_url_label,
          author_bio
        ),
        chapters (
          id,
          title,
          chapter_number,
          part_number,
          publish_at,
          coins,
          volume_id,
          age_rating,
          created_at
        ),
        categories:categories_on_novels (
          category:category_id (
            id,
            name,
            created_at,
            updated_at
          )
        )
      `, { count: 'exact' })
      .in('id', orderedNovelIds);

    // Apply category filters if provided
    if (categories?.included && categories.included.length > 0) {
      query = query.contains('categories', categories.included);
    }
    if (categories?.excluded && categories.excluded.length > 0) {
      query = query.not('categories', 'cs', `{${categories.excluded.join(',')}}`);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    console.log('Fetched novels count:', data?.length);

    // Sort the novels to match the order of orderedNovelIds
    const sortedNovels = data?.sort((a: Novel, b: Novel) => {
      const aIndex = orderedNovelIds.indexOf(a.id);
      const bIndex = orderedNovelIds.indexOf(b.id);
      return aIndex - bIndex;
    });

    // Log the first 5 novels after sorting
    console.log('First 5 novels after sorting:', sortedNovels?.slice(0, 5).map(novel => ({
      id: novel.id,
      title: novel.title,
      latestChapter: novel.chapters
        .sort((a: Chapter, b: Chapter) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
    })).map(n => ({
      id: n.id,
      title: n.title,
      latestChapterTitle: n.latestChapter?.title,
      latestChapterDate: n.latestChapter ? new Date(n.latestChapter.created_at).toLocaleString() : 'No chapters'
    })));

    // Apply pagination
    const paginatedNovels = sortedNovels?.slice(offset, offset + limit);

    console.log('Returning paginated novels:', {
      totalNovels: count,
      returnedNovels: paginatedNovels?.length,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil((count || 0) / limit)
    });

    return {
      novels: paginatedNovels?.map(novel => ({
        ...novel,
        coverImageUrl: novel.cover_image_url,
        translator: novel.translator ? {
          username: novel.translator.username,
          profile_id: novel.translator.id,
          kofiUrl: novel.translator.kofi_url,
          patreonUrl: novel.translator.patreon_url,
          customUrl: novel.translator.custom_url,
          customUrlLabel: novel.translator.custom_url_label,
          author_bio: novel.translator.author_bio
        } : null,
        categories: novel.categories?.map((item: { category: NovelCategory }) => item.category) || []
      })) || [],
      total: count || 0
    };
  } catch (error) {
    console.error('Error fetching novels:', error);
    return { novels: [], total: 0 };
  }
}

export async function getNovelsWithRecentUnlocks(
  limit: number = 12,
  offset: number = 0
): Promise<{ novels: Novel[]; total: number }> {
  try {
    // First get the latest chapter dates for each novel
    const { data: latestChapters } = await supabase
      .from('chapters')
      .select('novel_id, created_at')
      .order('created_at', { ascending: false });

    if (!latestChapters) {
      throw new Error('Failed to fetch latest chapters');
    }

    // Get unique novel IDs ordered by their latest chapter date
    const orderedNovelIds = [...new Set(latestChapters.map(ch => ch.novel_id))];
    
    if (orderedNovelIds.length === 0) {
      return { novels: [], total: 0 };
    }

    // Then fetch the full novel data in the correct order
    const { data: novels, error, count } = await supabase
      .from('novels')
      .select(`
        *,
        chapters (
          id,
          chapter_number,
          part_number,
          title,
          publish_at,
          coins,
          created_at
        )
      `, { count: 'exact' })
      .in('id', orderedNovelIds);

    if (error) throw error;

    // Sort the novels to match the order of orderedNovelIds
    const sortedNovels = novels?.sort((a, b) => {
      const aIndex = orderedNovelIds.indexOf(a.id);
      const bIndex = orderedNovelIds.indexOf(b.id);
      return aIndex - bIndex;
    });

    // Apply pagination
    const paginatedNovels = sortedNovels?.slice(offset, offset + limit);

    // Process and return novels
    return {
      novels: (paginatedNovels || []).map(novel => ({
        ...novel,
        coverImageUrl: novel.cover_image_url,
        slug: novel.slug
      })),
      total: count || 0
    };
  } catch (error) {
    console.error('Error fetching novels with recent unlocks:', error);
    return { novels: [], total: 0 };
  }
}

export async function getNovelsWithAdvancedChapters(): Promise<Novel[]> {
  try {    
    interface DBNovel {
      id: string;
      title: string;
      slug: string;
      cover_image_url: string | null;
      chapters: {
        chapter_number: number;
        part_number?: number;
        publish_at: string;
      }[];
    }

    const { data: novels, error } = await supabase
      .rpc('get_novels_with_advanced_chapters');

    if (error) throw error;

    console.log('Advanced chapters response:', novels);

    return (novels || []).map((novel: DBNovel) => {
      console.log('Processing novel:', novel.title, 'chapters:', novel.chapters);
      return {
        ...novel,
        coverImageUrl: novel.cover_image_url,
        chapters: novel.chapters || []
      };
    }) as Novel[];
  } catch (error) {
    console.error('Error fetching novels with advanced chapters:', error);
    return [];
  }
}

export async function getTopNovels(): Promise<Novel[]> {
  try {
    const { data, error } = await supabase
      .from('novels')
      .select(`
        *,
        translator:author_profile_id (
          id,
          username,
          kofi_url,
          patreon_url,
          custom_url,
          custom_url_label,
          author_bio
        ),
        categories:categories_on_novels (
          category:category_id (
            id,
            name,
            created_at,
            updated_at
          )
        )
      `)
      .order('views', { ascending: false })
      .limit(5);

    if (error) throw error;

    return (data || []).map(novel => ({
      ...novel,
      coverImageUrl: novel.cover_image_url,
      translator: novel.translator ? {
        username: novel.translator.username,
        profile_id: novel.translator.id,
        kofiUrl: novel.translator.kofi_url,
        patreonUrl: novel.translator.patreon_url,
        customUrl: novel.translator.custom_url,
        customUrlLabel: novel.translator.custom_url_label,
        author_bio: novel.translator.author_bio
      } : null,
      categories: novel.categories?.map((item: { category: NovelCategory }) => item.category) || []
    }));
  } catch (error) {
    console.error('Error fetching top novels:', error);
    return [];
  }
}