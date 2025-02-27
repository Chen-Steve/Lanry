import { useQuery } from '@tanstack/react-query';
import supabase from '@/lib/supabaseClient';
import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@iconify/react';

type Novel = {
  id: string;
  title: string;
  slug: string;
  cover_image_url: string | null;
  categories: Array<{
    category: {
      name: string;
    };
  }>;
};

export default function TranslatorWorks({ profileId }: { profileId: string }) {
  const { data: novels, isLoading } = useQuery<Novel[]>({
    queryKey: ['translator-works', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('novels')
        .select(`
          id,
          title,
          slug,
          cover_image_url,
          categories:categories_on_novels (
            category:category_id (
              name
            )
          )
        `)
        .eq('author_profile_id', profileId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      return (data || []) as unknown as Novel[];
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[2/3] bg-muted rounded-md mb-2" />
            <div className="h-4 bg-muted rounded w-3/4 mb-1" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!novels?.length) {
    return (
      <div className="text-center py-12">
        <Icon icon="mdi:book-off" className="w-16 h-16 mx-auto text-gray-400" />
        <p className="mt-4 text-gray-600">No translated works found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {novels.map((novel) => (
          <Link
            key={novel.id}
            href={`/novels/${novel.slug}`}
            className="group"
          >
            <div className="relative aspect-[2/3] mb-2 bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden">
              {novel.cover_image_url ? (
                <Image
                  src={novel.cover_image_url}
                  alt={novel.title}
                  fill
                  sizes="(min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
                  className="object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-accent">
                  <Icon icon="mdi:book-variant" className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
            </div>
            <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
              {novel.title}
            </h3>
            {novel.categories?.[0]?.category?.name && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {novel.categories[0].category.name}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
} 