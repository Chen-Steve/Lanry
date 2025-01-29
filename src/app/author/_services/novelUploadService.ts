import supabase from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { uploadImage } from '@/services/uploadService';
import { generateNovelSlug, generateUUID } from '@/lib/utils';
import { NovelCategory } from '@/types/database';

interface Novel {
  id: string;
  title: string;
  description: string;
  author: string;
  status: 'ONGOING' | 'COMPLETED' | 'HIATUS';
  slug: string;
  created_at: string;
  updated_at: string;
  author_profile_id: string;
  cover_image_url?: string;
  categories?: NovelCategory[];
}

interface CategoryData {
  category: NovelCategory;
}

export const fetchNovels = async (authorOnly: boolean = false) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return [];

    let query = supabase
      .from('novels')
      .select(`
        *,
        categories:categories_on_novels (
          category:category_id (
            id,
            name,
            created_at,
            updated_at
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (authorOnly) {
      query = query.eq('author_profile_id', session.user.id);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    return data?.map(novel => ({
      ...novel,
      categories: novel.categories?.map((c: CategoryData) => c.category) || []
    })) || [];
  } catch (error) {
    console.error('Error fetching novels:', error);
    toast.error('Failed to fetch novels');
    return [];
  }
};

export const fetchUserRole = async () => {
  try {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;

    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (error) throw error;
    return profileData.role;
  } catch (error) {
    console.error('Error fetching user role:', error);
    toast.error('Failed to fetch user role');
    return null;
  }
};

export const submitNovel = async (
  formData: {
    title: string;
    description: string;
    author: string;
    status: Novel['status'];
    slug: string;
  },
  imageFile: File | null,
  selectedCategories: NovelCategory[],
  editingNovel: Novel | null,
  userRole: string | null
) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('You must be logged in to create or edit a novel');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', session.user.id)
      .single();

    const slug = generateNovelSlug(formData.title);
    const isTranslator = userRole === 'TRANSLATOR';
    const authorName = isTranslator ? formData.author.trim() : (profile?.username || 'Anonymous');
    const novelId = editingNovel?.id || generateUUID();

    let coverImageUrl = editingNovel?.cover_image_url;
    if (imageFile) {
      try {
        coverImageUrl = await uploadImage(imageFile, session.user.id);
      } catch (error) {
        console.error('Error uploading image:', error);
        throw new Error('Failed to upload cover image');
      }
    }

    const novelData = {
      id: novelId,
      ...formData,
      author: authorName,
      slug,
      author_profile_id: session.user.id,
      is_author_name_custom: isTranslator,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      translator_id: isTranslator ? session.user.id : null,
      cover_image_url: coverImageUrl,
    };

    let error;

    if (editingNovel) {
      const { error: updateError } = await supabase
        .from('novels')
        .update({
          ...novelData,
          id: editingNovel.id
        })
        .eq('id', editingNovel.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('novels')
        .insert([novelData]);
      error = insertError;
    }

    if (error) throw error;

    if (selectedCategories.length > 0) {
      const categoryLinks = selectedCategories.map(category => ({
        novel_id: novelId,
        category_id: category.id
      }));

      if (editingNovel) {
        await supabase
          .from('categories_on_novels')
          .delete()
          .eq('novel_id', novelId);
      }

      const { error: categoryError } = await supabase
        .from('categories_on_novels')
        .insert(categoryLinks);

      if (categoryError) throw categoryError;
    }

    return novelId;
  } catch (error) {
    console.error(`Error ${editingNovel ? 'updating' : 'creating'} novel:`, error);
    throw error;
  }
};

export const deleteNovel = async (novelId: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    // Delete all chapter unlocks first
    const { error: unlockError } = await supabase
      .from('chapter_unlocks')
      .delete()
      .eq('novel_id', novelId);

    if (unlockError) throw unlockError;

    // Delete all bookmarks
    const { error: bookmarkError } = await supabase
      .from('bookmarks')
      .delete()
      .eq('novel_id', novelId);

    if (bookmarkError) throw bookmarkError;

    // Delete all reading history
    const { error: historyError } = await supabase
      .from('reading_history')
      .delete()
      .eq('novel_id', novelId);

    if (historyError) throw historyError;

    // Delete all novel ratings
    const { error: ratingError } = await supabase
      .from('novel_ratings')
      .delete()
      .eq('novel_id', novelId);

    if (ratingError) throw ratingError;

    // Delete all novel comments
    const { error: commentError } = await supabase
      .from('novel_comments')
      .delete()
      .eq('novel_id', novelId);

    if (commentError) throw commentError;

    // Delete all chapters
    const { error: chapterError } = await supabase
      .from('chapters')
      .delete()
      .eq('novel_id', novelId);

    if (chapterError) throw chapterError;

    // Delete all volumes
    const { error: volumeError } = await supabase
      .from('volumes')
      .delete()
      .eq('novel_id', novelId);

    if (volumeError) throw volumeError;

    // Delete all categories associations
    const { error: categoryError } = await supabase
      .from('categories_on_novels')
      .delete()
      .eq('novel_id', novelId);

    if (categoryError) throw categoryError;

    // Delete all tags associations
    const { error: tagError } = await supabase
      .from('tags_on_novels')
      .delete()
      .eq('novel_id', novelId);

    if (tagError) throw tagError;

    // Delete all characters
    const { error: characterError } = await supabase
      .from('novel_characters')
      .delete()
      .eq('novel_id', novelId);

    if (characterError) throw characterError;

    // Finally delete the novel
    const { error } = await supabase
      .from('novels')
      .delete()
      .eq('id', novelId)
      .eq('author_profile_id', session.user.id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting novel:', error);
    throw error;
  }
}; 