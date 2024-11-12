import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import supabase from '@/lib/supabaseClient';
import { Icon } from '@iconify/react';
import Link from 'next/link';

interface Novel {
  id: string;
  title: string;
  author: string;
  description: string;
}

interface Bookmark {
  id: string;
  profileId: string;
  novelId: string;
  createdAt: string;
  novel: Novel;
}

// Separate data fetching logic
const fetchBookmarks = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('bookmarks')
    .select('*, novel:novels(*)')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Reusable bookmark card component
const BookmarkCard = ({ bookmark, onRemove }: { bookmark: Bookmark; onRemove: (id: string) => void }) => {
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <h3 className="font-medium mb-2">{bookmark.novel.title}</h3>
      <div className="flex justify-between items-center">
        <Link
          href={`/novels/${bookmark.novel.id}`}
          className="text-blue-500 hover:text-blue-600 flex items-center gap-1"
        >
          <Icon icon="mdi:book-open-page-variant" width="20" />
          <span>Read</span>
        </Link>
        <button
          onClick={() => onRemove(bookmark.id)}
          className="text-red-500 hover:text-red-600 flex items-center gap-1"
        >
          <Icon icon="mdi:bookmark-remove" width="20" />
          <span>Remove</span>
        </button>
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

export default function Bookmarks() {
  const queryClient = useQueryClient();

  // Query for fetching bookmarks
  const { data: bookmarks, isLoading, isError, error } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: fetchBookmarks,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    retry: 2,
  });

  // Update the mutation with proper types
  const removeMutation = useMutation<void, Error, string>({
    mutationFn: async (bookmarkId: string) => {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId);
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
} 