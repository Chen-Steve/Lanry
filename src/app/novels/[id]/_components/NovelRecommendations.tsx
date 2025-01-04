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
      <div className="bg-card rounded-xl shadow-sm border border-border p-3 sm:p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-muted rounded-lg aspect-[2/3] mb-2"></div>
              <div className="bg-muted h-3 rounded w-3/4 mb-1.5"></div>
              <div className="bg-muted h-3 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-card rounded-xl shadow-sm border border-border p-4">
        <div className="text-center text-muted-foreground py-6">
          <Icon icon="pepicons-print:book" className="text-3xl sm:text-4xl mx-auto mb-2" />
          <p className="text-sm sm:text-base">No recommendations found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border p-2 sm:p-3">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {recommendations.map((novel) => (
          <Link
            key={novel.id}
            href={`/novels/${novel.slug}`}
            className="block hover:opacity-80 transition-opacity"
          >
            <div className="relative aspect-[2/3] bg-muted rounded-sm">
              {novel.coverImageUrl ? (
                <Image
                  src={novel.coverImageUrl.startsWith('http') ? novel.coverImageUrl : `/novel-covers/${novel.coverImageUrl}`}
                  alt={`Cover for ${novel.title}`}
                  fill
                  className="object-cover rounded-sm"
                  sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16.666vw"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-sm">
                  <Icon icon="pepicons-print:book" className="text-lg text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="mt-1 px-0.5">
              <h3 className="text-xs font-medium text-foreground line-clamp-1">
                {novel.title}
              </h3>
              <div className="text-muted-foreground flex items-center gap-1.5 text-[10px] mt-0.5">
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