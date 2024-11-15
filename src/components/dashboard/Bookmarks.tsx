import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import supabase from '@/lib/supabaseClient';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useEffect } from 'react';

interface Novel {
  id: string;
  title: string;
  author: string;
  description: string;
  slug: string | null;
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
        description,
        slug
      )
    `)
    .eq('profile_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Reusable bookmark card component
const BookmarkCard = ({ bookmark, onRemove }: { bookmark: Bookmark; onRemove: (id: string) => void }) => {
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-all duration-200 bg-white relative group">
      <div className="space-y-2">
        <h3 className="font-semibold text-lg text-gray-800 line-clamp-1">
          {bookmark.novel.title}
        </h3>
        <p className="text-sm text-gray-600 italic">
          by {bookmark.novel.author}
        </p>
        <p className="text-sm text-gray-700 line-clamp-2 mb-4">
          {bookmark.novel.description}
        </p>
        <div className="flex justify-between items-center pt-2 border-t">
          <Link
            href={`/novels/${bookmark.novel.slug || bookmark.novel.id}`}
            className="text-blue-600 hover:text-blue-700 flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-blue-50 transition-colors"
          >
            <Icon icon="mdi:book-open-page-variant" width="18" />
            <span className="text-sm font-medium">Read Now</span>
          </Link>
          <button
            onClick={() => onRemove(bookmark.id)}
            className="text-gray-500 hover:text-red-600 flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors"
            aria-label="Remove bookmark"
          >
            <Icon icon="mdi:bookmark-remove" width="18" />
            <span className="text-sm font-medium">Remove</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Loading skeleton
const BookmarksSkeleton = () => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="border rounded-lg p-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="flex justify-between">
          <div className="h-8 bg-gray-200 rounded w-16"></div>
          <div className="h-8 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    ))}
  </div>
);

const Bookmarks = ({ userId }: BookmarksProps) => {
  const queryClient = useQueryClient();

  // Add auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        // Refetch bookmarks when user signs in
        queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  // Query for fetching bookmarks
  const { data: bookmarks, isLoading, isError, error } = useQuery({
    queryKey: ['bookmarks', userId],
    queryFn: () => fetchBookmarks(userId),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    retry: 2,
    enabled: !!userId, // Only run query when userId is available
  });

  // Update the mutation with proper types
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
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">My Bookmarks</h2>
        <BookmarksSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-center text-red-500">
        <Icon icon="mdi:alert" className="w-12 h-12 mx-auto mb-2" />
        <p>Error loading bookmarks: {(error as Error).message}</p>
        <button 
          onClick={() => queryClient.invalidateQueries({ queryKey: ['bookmarks'] })}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">My Bookmarks</h2>
      {(!bookmarks || bookmarks.length === 0) ? (
        <div className="text-center py-8">
          <Icon icon="mdi:bookmark-outline" className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">
            No bookmarks yet. Start bookmarking your favorite novels!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bookmarks.map((bookmark: Bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              onRemove={(id) => removeMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Bookmarks; 