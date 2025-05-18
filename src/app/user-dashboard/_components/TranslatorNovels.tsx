'use client';

import { useQuery } from '@tanstack/react-query';
import supabase from '@/lib/supabaseClient';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const ITEMS_PER_PAGE = 6;

interface Novel {
  id: string;
  title: string;
  slug: string;
  cover_image_url: string | null;
}

interface NovelsResponse {
  data: Novel[];
  count: number | null;
}

const fetchUserNovels = async (userId: string, page: number): Promise<NovelsResponse> => {
  const { data, error, count } = await supabase
    .from('novels')
    .select(`
      id,
      title,
      slug,
      cover_image_url
    `, { count: 'exact' })
    .or(`translator_id.eq.${userId},author_profile_id.eq.${userId}`)
    .order('updated_at', { ascending: false })
    .range((page - 1) * ITEMS_PER_PAGE, (page * ITEMS_PER_PAGE) - 1);

  if (error) throw error;
  return { data: data || [], count };
};

export function TranslatorNovels({ translatorId }: { translatorId: string }) {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [page, setPage] = useState(1);
  
  const { data, isLoading, error } = useQuery<NovelsResponse>({
    queryKey: ['user-novels', translatorId, page],
    queryFn: () => fetchUserNovels(translatorId, page),
    staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
    gcTime: 10 * 60 * 1000,   // Cache is kept for 10 minutes
    retry: 1
  });

  useEffect(() => {
    if (data?.data && data.data.length > 0) {
      setNovels(prev => [...prev, ...data.data]);
    }
  }, [data]);

  const totalCount = data?.count || 0;
  const hasMore = totalCount > novels.length;

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  if (isLoading && page === 1) {
    return <div className="text-center py-8">Loading novels...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error loading novels</div>;
  }

  if (!novels || novels.length === 0) {
    return <div className="text-center py-8">No novels found</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {novels.map((novel) => (
          <Link href={`/novels/${novel.slug}`} key={novel.id} className="group">
            <div className="rounded-md overflow-hidden bg-[#f7f3ec] dark:bg-zinc-900">
              <div className="aspect-[2/3] relative w-full max-w-[120px] overflow-hidden">
                {novel.cover_image_url ? (
                  <img
                    src={novel.cover_image_url}
                    alt={novel.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-black text-xs">
                    No Cover
                  </div>
                )}
              </div>
              <div className="p-1.5">
                <h3 className="font-medium text-black dark:text-white text-xs line-clamp-1">{novel.title}</h3>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
} 