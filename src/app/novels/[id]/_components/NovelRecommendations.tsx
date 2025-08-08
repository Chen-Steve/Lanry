import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';
import Link from 'next/link';
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
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
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
      }
    };

    fetchRecommendations();
  }, [novelId, categories, tags]);

  return (
    <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
      {recommendations.map((novel) => (
        <Link
          key={novel.id}
          href={`/novels/${novel.slug}`}
          className="block hover:opacity-80 transition-opacity"
        >
          <div className="relative aspect-[3/4] bg-muted rounded-sm">
            {novel.coverImageUrl ? (
              <img
                src={novel.coverImageUrl.startsWith('http') ? novel.coverImageUrl : `/novel-covers/${novel.coverImageUrl}`}
                alt={`Cover for ${novel.title}`}
                className="absolute inset-0 w-full h-full object-cover rounded-sm"
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-sm">
                <span className="text-xs text-muted-foreground">No Cover</span>
              </div>
            )}
          </div>
          <div className="mt-0.5 px-0.5">
            <h3 className="text-xs font-medium text-foreground line-clamp-1">
              {novel.title}
            </h3>
          </div>
        </Link>
      ))}
    </div>
  );
}; 