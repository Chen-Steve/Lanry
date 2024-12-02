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
          .select('*')
          .neq('id', novelId)
          .limit(6);

        if (error) throw error;
        
        const mappedNovels = (novels || []).map(novel => ({
          ...novel,
          coverImageUrl: novel.cover_image_url
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
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((novel) => (
          <Link
            key={novel.id}
            href={`/novels/${novel.slug}`}
            className="group hover:shadow-md transition-shadow rounded-lg overflow-hidden border"
          >
            <div className="relative aspect-[3/2] bg-gray-100">
              {novel.coverImageUrl ? (
                <Image
                  src={`/novel-covers/${novel.coverImageUrl}`}
                  alt={`Cover for ${novel.title}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                  <Icon icon="pepicons-print:book" className="text-4xl text-gray-400" />
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="font-medium text-gray-900 line-clamp-1 mb-1">
                {novel.title}
              </h3>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Icon icon="pepicons-print:eye" className="text-base" />
                  {novel.views || 0}
                </span>
                <span className="flex items-center gap-1">
                  <Icon icon="pepicons-print:bookmark" className="text-base" />
                  {novel.bookmarkCount || 0}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}; 