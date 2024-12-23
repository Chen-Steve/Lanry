import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import supabase from '@/lib/supabaseClient';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useEffect } from 'react';
import Image from 'next/image';

interface Novel {
  id: string;
  title: string;
  author: string;
  slug: string | null;
  cover_image_url: string;
}

interface Bookmark {
  id: string;
  profileId: string;
  novelId: string;
  createdAt: string;
  novel: Novel;
}

interface BookmarksProps {
  userId: string | undefined;
  isOwnProfile?: boolean;
}

// Separate data fetching logic
const fetchBookmarks = async (userId: string | undefined) => {
  if (!userId) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('bookmarks')
    .select(`
      *,
      novel:novels (
        id,
        title,
        author,
        slug,
        cover_image_url
      )
    `)
    .eq('profile_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

const Bookmarks = ({ userId, isOwnProfile = false }: BookmarksProps) => {
  const queryClient = useQueryClient();

  // Add auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const { data: bookmarks, isLoading, error } = useQuery({
    queryKey: ['bookmarks', userId],
    queryFn: () => fetchBookmarks(userId),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    enabled: !!userId,
  });

  const removeMutation = useMutation<void, Error, string>({
    mutationFn: async (bookmarkId: string) => {
      if (!userId) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId)
        .eq('profile_id', userId);
      if (error) throw error;
    },
    onSuccess: (_data: void, bookmarkId: string) => {
      queryClient.setQueryData(['bookmarks'], (old: Bookmark[] = []) =>
        old.filter((bookmark) => bookmark.id !== bookmarkId)
      );
    },
    onError: (error: Error) => {
      console.error('Error removing bookmark:', error);
    },
  });

  if (isLoading) {
    return <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />;
  }

  if (error) {
    return (
      <>
        <Icon icon="mdi:alert" className="w-12 h-12 mx-auto mb-2" />
        <p className="text-center text-red-500">Error loading bookmarks</p>
      </>
    );
  }

  if (!bookmarks || bookmarks.length === 0) {
    return (
      <>
        <Icon icon="mdi:bookmark-outline" className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <p className="text-center text-gray-500 text-lg">
          No bookmarks yet. Start bookmarking your favorite novels!
        </p>
      </>
    );
  }

  return (
    <>
      {bookmarks.map((bookmark) => (
        <article
          key={bookmark.id}
          className="-mx-4 sm:mx-0 flex gap-2 sm:gap-4 items-center min-w-0 px-4 sm:px-0 border-b border-gray-200 last:border-b-0"
        >
          <Link 
            href={`/novels/${bookmark.novel.slug}`} 
            className="hover:opacity-80 transition-opacity flex-shrink-0"
          >
            <Image
              src={bookmark.novel.cover_image_url?.startsWith('http') 
                ? bookmark.novel.cover_image_url 
                : `/novel-covers/${bookmark.novel.cover_image_url}` || '/images/default-cover.jpg'}
              alt={bookmark.novel.title}
              width={120}
              height={120}
              priority
              className="object-cover shadow-sm w-[60px] h-[60px] sm:w-[120px] sm:h-[120px]"
            />
          </Link>
          <div className="flex-grow min-w-0">
            <Link 
              href={`/novels/${bookmark.novel.slug}`}
              className="text-black font-medium text-base sm:text-lg hover:text-blue-600 transition-colors block truncate"
            >
              {bookmark.novel.title}
            </Link>
            <p className="text-xs sm:text-sm text-black mt-0.5 sm:mt-1 truncate">
              by {bookmark.novel.author}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Link
              href={`/novels/${bookmark.novel.slug}`}
              className="flex items-center gap-1.5 text-black px-3 py-1.5 border border-black rounded-md touch-action-manipulation whitespace-nowrap text-xs sm:text-base transition-colors hover:bg-gray-100"
            >
              <span>Read</span>
            </Link>
            {isOwnProfile && (
              <button
                onClick={() => removeMutation.mutate(bookmark.id)}
                className="flex items-center gap-1.5 text-red-600 px-3 py-1.5 border border-red-600 rounded-md touch-action-manipulation whitespace-nowrap text-xs sm:text-base transition-colors hover:bg-red-50"
                aria-label="Remove bookmark"
              >
                <span>Remove</span>
              </button>
            )}
          </div>
        </article>
      ))}
    </>
  );
};

export default Bookmarks; 