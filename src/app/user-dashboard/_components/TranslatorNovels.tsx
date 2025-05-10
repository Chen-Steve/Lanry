'use client';

import { useQuery } from '@tanstack/react-query';
import supabase from '@/lib/supabaseClient';
import Link from 'next/link';

const fetchTranslatorNovels = async (translatorId: string) => {
  // Fetch novels where user is translator_id
  const { data: translatedNovels, error: translatedError } = await supabase
    .from('novels')
    .select(`
      id,
      title,
      slug,
      cover_image_url
    `)
    .eq('translator_id', translatorId)
    .order('updated_at', { ascending: false });

  if (translatedError) throw translatedError;

  // Fetch novels where user is author_profile_id and is_author_name_custom is true
  // (these are also considered translated novels, see translators/page.tsx)
  const { data: authoredNovels, error: authoredError } = await supabase
    .from('novels')
    .select(`
      id,
      title,
      slug,
      cover_image_url
    `)
    .eq('author_profile_id', translatorId)
    .eq('is_author_name_custom', true)
    .order('updated_at', { ascending: false });

  if (authoredError) throw authoredError;

  // Combine both types of novels and remove duplicates
  const allNovels = [...(translatedNovels || []), ...(authoredNovels || [])];
  
  // Remove duplicates by using a Map with novel.id as the key
  const uniqueNovelsMap = new Map();
  allNovels.forEach(novel => {
    if (!uniqueNovelsMap.has(novel.id)) {
      uniqueNovelsMap.set(novel.id, novel);
    }
  });
  
  return Array.from(uniqueNovelsMap.values());
};

export function TranslatorNovels({ translatorId }: { translatorId: string }) {
  const { data: novels, isLoading, error } = useQuery({
    queryKey: ['translator-novels', translatorId],
    queryFn: () => fetchTranslatorNovels(translatorId),
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading novels...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error loading novels</div>;
  }

  if (!novels || novels.length === 0) {
    return <div className="text-center py-8">No novels found for this translator</div>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {novels.map((novel) => (
        <Link href={`/novels/${novel.slug}`} key={novel.id} className="group">
          <div className="rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-border bg-card">
            <div className="aspect-[2/3] relative w-full overflow-hidden bg-accent/10">
              {novel.cover_image_url ? (
                <img
                  src={novel.cover_image_url}
                  alt={novel.title}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-foreground/50 text-xs">
                  No Cover
                </div>
              )}
            </div>
            <div className="p-2">
              <h3 className="font-medium text-foreground text-sm line-clamp-1">{novel.title}</h3>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
} 