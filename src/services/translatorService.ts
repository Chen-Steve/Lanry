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
  novels: Novel[];
  role: string;
}

interface Novel {
  id: string;
  chapters: { count: number }[];
}

export const getTranslators = async (): Promise<Translator[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      username,
      avatar_url,
      author_bio,
      novels:novels!translator_id (
        id,
        chapters(count)
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

  return (data as TranslatorData[]).map(translator => ({
    id: translator.id,
    username: translator.username,
    avatarUrl: translator.avatar_url,
    bio: translator.author_bio,
    novelCount: translator.novels.length,
    chapterCount: translator.novels.reduce((total, novel) => 
      total + (novel.chapters[0]?.count || 0), 0)
  }));
}; 