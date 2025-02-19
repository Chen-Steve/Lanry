import supabase from '@/lib/supabaseClient';

export interface Novel {
  id: string;
  title: string;
  author?: string;
  slug: string | null;
  cover_image_url: string;
}

export interface Bookmark {
  id: string;
  profileId: string;
  novelId: string;
  createdAt: string;
  novel: Novel;
}

export interface BookmarkPage {
  data: Bookmark[];
  count: number | null;
}

export const ITEMS_PER_PAGE = 10;

export const fetchBookmarkPage = async (
  userId: string | undefined, 
  page: number, 
  folderId: string | null
): Promise<BookmarkPage> => {
  if (!userId) throw new Error('Not authenticated');

  const from = page * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  let query = supabase
    .from('bookmarks')
    .select(`
      id,
      novel:novels (
        id,
        title,
        slug,
        cover_image_url
      )
    `, { count: 'exact' })
    .eq('profile_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (folderId !== null) {
    query = query.eq('folder_id', folderId);
  }

  const { data, error, count } = await query;

  if (error) throw error;
  return { 
    data: data as unknown as Bookmark[],
    count 
  };
};

export const createBookmarkFolder = async (userId: string | undefined, name: string) => {
  if (!userId) throw new Error('Not authenticated');

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('bookmark_folders')
    .insert({
      id,
      name,
      profile_id: userId,
      icon: 'mdi:folder',
      created_at: now,
      updated_at: now
    })
    .select()
    .single();

  if (error) {
    console.error('Supabase error:', error);
    throw error;
  }
  return data;
};

export const updateBookmarkFolder = async (
  userId: string | undefined,
  bookmarkId: string,
  folderId: string | null
) => {
  if (!userId) throw new Error('Not authenticated');
  
  const { error } = await supabase
    .from('bookmarks')
    .update({ folder_id: folderId })
    .eq('id', bookmarkId)
    .eq('profile_id', userId);

  if (error) throw error;
};

export const removeBookmark = async (userId: string | undefined, bookmarkId: string) => {
  if (!userId) throw new Error('Not authenticated');
  
  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('id', bookmarkId)
    .eq('profile_id', userId);

  if (error) throw error;
}; 