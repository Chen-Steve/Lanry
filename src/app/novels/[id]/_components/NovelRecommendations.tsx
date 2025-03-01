import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';
import Link from 'next/link';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import type { Novel, NovelCategory, Tag } from '@/types/database';

interface NovelRecommendationsProps {
  novelId: string;
  categories?: NovelCategory[];
  tags?: Tag[];
}

interface CategoryJoinRow {
  category: {
    id: string;
    name: string;
  };
}

interface TagJoinRow {
  tag: {
    id: string;
    name: string;
  };
}

interface NovelWithRelations extends Omit<Novel, 'categories' | 'tags'> {
  categories: CategoryJoinRow[];
  tags: TagJoinRow[];
  cover_image_url: string;
}

export const NovelRecommendations = ({ novelId, categories = [], tags = [] }: NovelRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<(Novel & { relevanceScore?: number })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        if (!categories.length && !tags.length) {
          // If no categories or tags, fetch random recommendations
          const { data: novels, error } = await supabase
            .from('novels')
            .select('*')
            .neq('id', novelId)
            .limit(6);

          if (error) throw error;
          
          const mappedNovels = (novels || []).map(novel => ({
            ...novel,
            coverImageUrl: novel.cover_image_url,
            categories: [],
            tags: []
          })) as (Novel & { relevanceScore?: number })[];
          
          setRecommendations(mappedNovels);
          return;
        }

        // Fetch novels that share categories or tags
        const categoryIds = categories.map(category => category.id);
        const tagIds = tags.map(tag => tag.id);

        const { data: novels, error } = await supabase
          .from('novels')
          .select(`
            *,
            categories:categories_on_novels(category:category_id(*)),
            tags:tags_on_novels(tag:tag_id(*))
          `)
          .neq('id', novelId)
          .or(`categories.category_id.in.(${categoryIds.join(',')}),tags.tag_id.in.(${tagIds.join(',')})`)
          .limit(12);

        if (error) throw error;

        // Map and sort novels by relevance (number of matching categories and tags)
        const mappedNovels = (novels as NovelWithRelations[] || []).map(novel => {
          const novelCategories = novel.categories?.map(c => c.category.id) || [];
          const novelTags = novel.tags?.map(t => t.tag.id) || [];
          
          // Calculate relevance score
          const matchingCategories = categoryIds.filter(id => novelCategories.includes(id)).length;
          const matchingTags = tagIds.filter(id => novelTags.includes(id)).length;
          const relevanceScore = (matchingCategories * 2) + matchingTags; // Categories weighted more heavily

          // Transform to match Novel type
          const transformedNovel: Novel & { relevanceScore: number } = {
            ...novel,
            coverImageUrl: novel.cover_image_url,
            categories: novel.categories.map(c => ({
              id: c.category.id,
              name: c.category.name,
              created_at: '',
              updated_at: ''
            })),
            tags: novel.tags.map(t => ({
              id: t.tag.id,
              name: t.tag.name,
              createdAt: new Date(),
              updatedAt: new Date()
            })),
            relevanceScore
          };

          return transformedNovel;
        });

        // Sort by relevance score and take top 6
        const sortedNovels = mappedNovels
          .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
          .slice(0, 6);

        setRecommendations(sortedNovels);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [novelId, categories, tags]);

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
              <h3 className="text-base sm:text-base font-bold text-foreground line-clamp-1">
                {novel.title}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}; 