import supabase from '@/lib/supabaseClient';

export interface Translator {
  id: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  novelCount: number;
  chapterCount: number;
}

interface TranslatorData {
  id: string;
  username: string;
  avatar_url: string | null;
  author_bio: string | null;
  translatedNovels: Novel[];
  authoredNovels: Novel[];
  role: string;
}

interface Novel {
  id: string;
  chapters: { count: number }[];
  is_author_name_custom: boolean;
}

export const getTranslators = async (): Promise<Translator[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      username,
      avatar_url,
      author_bio,
      translatedNovels:novels!translator_id (
        id,
        chapters(count)
      ),
      authoredNovels:novels!author_profile_id (
        id,
        chapters(count),
        is_author_name_custom
      ),
      role
    `)
    .eq('role', 'TRANSLATOR')
    .not('username', 'is', null)
    .order('username');

  if (error) {
    console.error('Error fetching translators:', error);
    return [];
  }

  return (data as TranslatorData[])
    .filter(translator => {
      // Count novels where user is translator_id
      const translatedCount = translator.translatedNovels?.length || 0;
      // Count novels where user is author_profile_id AND is_author_name_custom is true
      const authoredAsTranslatorCount = translator.authoredNovels?.filter(n => n.is_author_name_custom)?.length || 0;
      
      // Only include translators who have at least one novel in either category
      return translatedCount > 0 || authoredAsTranslatorCount > 0;
    })
    .map(translator => {
      // Combine both types of novels for counts
      const allTranslatedNovels = [
        ...(translator.translatedNovels || []),
        ...(translator.authoredNovels?.filter(n => n.is_author_name_custom) || [])
      ];

      return {
        id: translator.id,
        username: translator.username,
        avatarUrl: translator.avatar_url,
        bio: translator.author_bio,
        novelCount: allTranslatedNovels.length,
        chapterCount: allTranslatedNovels.reduce((total, novel) => 
          total + (novel.chapters[0]?.count || 0), 0)
      };
    });
}; 