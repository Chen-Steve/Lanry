import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import supabase from '@/lib/supabaseClient';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useEffect, useState, memo } from 'react';
import Image from 'next/image';
import { useInView } from 'react-intersection-observer';
import { ErrorBoundary } from 'react-error-boundary';

interface Novel {
  id: string;
  title: string;
  author?: string;
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

interface DeleteConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
}

interface BookmarkPage {
  data: Bookmark[];
  count: number | null;
}

interface InfiniteBookmarkData {
  pages: BookmarkPage[];
  pageParams: number[];
}

// Update the items per page constant
const ITEMS_PER_PAGE = 10;

const fetchBookmarkPage = async (userId: string | undefined, page: number): Promise<BookmarkPage> => {
  if (!userId) throw new Error('Not authenticated');

  const from = page * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  const { data, error, count } = await supabase
    .from('bookmarks')
    .select(`
      id,
      novel:novels (
        id,
        title,
        slug,
        cover_image_url
      )
    `, { count: 'exact' })
    .eq('profile_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { 
    data: data as unknown as Bookmark[],
    count 
  };
};

const DeleteConfirmation = memo(({ isOpen, onClose, onConfirm, title }: DeleteConfirmationProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-background rounded-lg p-4 shadow-lg max-w-sm w-full mx-4">
        <h3 className="text-lg font-medium mb-2">Delete Bookmark</h3>
        <p className="text-muted-foreground mb-4">
          Are you sure you want to remove &quot;{title}&quot; from your bookmarks?
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
});
DeleteConfirmation.displayName = 'DeleteConfirmation';

const BookmarkItem = memo(({ 
  bookmark, 
  isOwnProfile, 
  onDeleteClick, 
  isFirstPage,
  index 
}: { 
  bookmark: Bookmark; 
  isOwnProfile: boolean; 
  onDeleteClick: (id: string, title: string) => void;
  isFirstPage: boolean;
  index: number;
}) => {
  const isPriority = isFirstPage && index < 4;

  return (
    <div className="relative group space-y-0.5">
      {isOwnProfile && (
        <button
          onClick={() => onDeleteClick(bookmark.id, bookmark.novel.title)}
          className="absolute top-0.5 right-0.5 z-10 p-0.5 bg-black/60 hover:bg-red-500/80 rounded-full text-white transition-colors"
          aria-label="Remove bookmark"
        >
          <Icon icon="mdi:trash-can" className="w-3 h-3" />
        </button>
      )}
      <Link 
        href={`/novels/${bookmark.novel.slug}`}
        className="block space-y-0.5"
      >
        <div className="aspect-[2/3] relative overflow-hidden rounded-sm shadow-sm hover:shadow transition-shadow">
          <Image
            src={bookmark.novel.cover_image_url?.startsWith('http') 
              ? bookmark.novel.cover_image_url 
              : `/novel-covers/${bookmark.novel.cover_image_url}` || '/images/default-cover.jpg'}
            alt={bookmark.novel.title}
            fill
            sizes="(max-width: 640px) 25vw, (max-width: 768px) 16.67vw, (max-width: 1024px) 12.5vw, 8.33vw"
            loading={isPriority ? "eager" : "lazy"}
            priority={isPriority}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="px-0.5">
          <h3 className="text-[10px] font-medium truncate leading-tight hover:text-primary transition-colors">{bookmark.novel.title}</h3>
        </div>
      </Link>
    </div>
  );
});
BookmarkItem.displayName = 'BookmarkItem';

const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => {
  return (
    <div className="text-center">
      <Icon icon="mdi:alert" className="w-12 h-12 mx-auto mb-2 text-red-500 dark:text-red-400" />
      <p className="text-red-500 dark:text-red-400 mb-4">{error.message}</p>
      <button
        onClick={() => resetErrorBoundary()}
        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
      >
        Try again
      </button>
    </div>
  );
};

const Bookmarks = ({ userId, isOwnProfile = false }: BookmarksProps) => {
  const queryClient = useQueryClient();
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; title: string } | null>(null);
  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: '100px',
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey: ['bookmarks', userId],
    queryFn: ({ pageParam = 0 }) => fetchBookmarkPage(userId, pageParam as number),
    getNextPageParam: (lastPage: BookmarkPage, allPages: BookmarkPage[]) => {
      const totalFetched = allPages.length * ITEMS_PER_PAGE;
      return totalFetched < (lastPage.count || 0) ? allPages.length : undefined;
    },
    initialPageParam: 0,
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Memoize the auth subscription setup
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

  const removeMutation = useMutation<void, Error, string, { previousBookmarks: InfiniteBookmarkData | undefined }>({
    mutationFn: async (bookmarkId: string) => {
      if (!userId) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId)
        .eq('profile_id', userId);
      if (error) throw error;
    },
    onMutate: async (bookmarkId: string) => {
      await queryClient.cancelQueries({ queryKey: ['bookmarks', userId] });
      const previousBookmarks = queryClient.getQueryData<InfiniteBookmarkData>(['bookmarks', userId]);
      queryClient.setQueryData<InfiniteBookmarkData>(['bookmarks', userId], (old) => {
        if (!old) return { pages: [], pageParams: [] };
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.filter((bookmark) => bookmark.id !== bookmarkId)
          }))
        };
      });
      return { previousBookmarks };
    },
    onError: (err, bookmarkId, context) => {
      console.error('Error removing bookmark:', err);
      queryClient.setQueryData(['bookmarks', userId], context?.previousBookmarks);
      setDeleteConfirmation(null);
    },
    onSuccess: () => {
      setDeleteConfirmation(null);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks', userId] });
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorBoundary 
        FallbackComponent={ErrorFallback} 
        onReset={() => refetch()}
      >
        <Icon icon="mdi:alert" className="w-12 h-12 mx-auto mb-2 text-red-500 dark:text-red-400" />
        <p className="text-center text-red-500 dark:text-red-400">Error loading bookmarks</p>
      </ErrorBoundary>
    );
  }

  if (!data?.pages[0].data || data.pages[0].data.length === 0) {
    return (
      <>
        <Icon icon="mdi:bookmark-outline" className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <p className="text-center text-muted-foreground text-lg">
          No bookmarks yet. Start bookmarking your favorite novels!
        </p>
      </>
    );
  }

  return (
    <>
      <DeleteConfirmation
        isOpen={!!deleteConfirmation}
        onClose={() => setDeleteConfirmation(null)}
        onConfirm={() => {
          if (deleteConfirmation) {
            removeMutation.mutate(deleteConfirmation.id);
          }
        }}
        title={deleteConfirmation?.title || ''}
      />
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
        {data.pages.map((page, pageIndex) => (
          page.data.map((bookmark, bookmarkIndex) => {
            const isLastBookmark = pageIndex === data.pages.length - 1 && bookmarkIndex === page.data.length - 1;
            
            return (
              <div 
                key={bookmark.id} 
                ref={isLastBookmark ? ref : undefined}
              >
                <BookmarkItem
                  bookmark={bookmark}
                  isOwnProfile={isOwnProfile}
                  onDeleteClick={(id, title) => setDeleteConfirmation({ id, title })}
                  isFirstPage={pageIndex === 0}
                  index={bookmarkIndex}
                />
              </div>
            );
          })
        ))}
      </div>
      {isFetchingNextPage && (
        <div className="mt-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        </div>
      )}
    </>
  );
};

export default memo(Bookmarks); 