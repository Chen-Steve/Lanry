import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';
import Link from 'next/link';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { Novel } from '@/types/database';

interface NovelRecommendationsProps {
  novelId: string;
  genre?: string;
}

export const NovelRecommendations = ({ novelId }: NovelRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<Novel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const { data: novels, error } = await supabase
          .from('novels')
          .select('*, bookmark_count')
          .neq('id', novelId)
          .limit(6);

        if (error) throw error;
        
        const mappedNovels = (novels || []).map(novel => ({
          ...novel,
          coverImageUrl: novel.cover_image_url,
          bookmarkCount: novel.bookmark_count
        }));
        
        setRecommendations(mappedNovels);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [novelId]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-40 mb-2"></div>
              <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
              <div className="bg-gray-200 h-4 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="text-center text-gray-600 py-8">
          <Icon icon="pepicons-print:book" className="text-4xl mx-auto mb-2" />
          <p>No recommendations found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-2">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((novel) => (
          <Link
            key={novel.id}
            href={`/novels/${novel.slug}`}
            className="block"
          >
            <div className="relative aspect-[3/2] bg-gray-100">
              {novel.coverImageUrl ? (
                <Image
                  src={`/novel-covers/${novel.coverImageUrl}`}
                  alt={`Cover for ${novel.title}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                  <Icon icon="pepicons-print:book" className="text-3xl text-gray-400" />
                </div>
              )}
            </div>
            <div className="mt-1">
              <h3 className="text-sm line-clamp-1">
                {novel.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span>{novel.views || 0} views</span>
                <span>{novel.bookmarkCount || 0} bookmarks</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}; 