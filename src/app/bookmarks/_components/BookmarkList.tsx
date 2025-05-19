'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@iconify/react';
import { useState, memo, useEffect } from 'react';
import { toast } from 'sonner';
import BookmarkItem from './BookmarkItem';
import supabase from '@/lib/supabaseClient';
import type { AuthChangeEvent } from '@supabase/supabase-js';
import { 
  fetchBookmarkPage, 
  removeBookmark,
  type BookmarkPage,
} from '@/services/bookmarkService';
import { fetchFolders } from './BookmarkFolders';

interface BookmarkListProps {
  userId: string | undefined;
  isOwnProfile?: boolean;
  mode?: 'view' | 'select';
  selectedItems?: string[];
  onSelectionChange?: (items: string[]) => void;
}

interface DeleteConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
}

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

const BookmarkList = ({ 
  userId, 
  isOwnProfile = false,
  mode = 'view',
  selectedItems = [],
  onSelectionChange = () => {}
}: BookmarkListProps) => {
  const queryClient = useQueryClient();
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; title: string } | null>(null);

  const { data: folders = [] } = useQuery({
    queryKey: ['bookmarkFolders', userId],
    queryFn: () => fetchFolders(userId),
    enabled: !!userId && isOwnProfile,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const { data, isLoading, error } = useQuery<BookmarkPage>({
    queryKey: ['bookmarks', userId],
    queryFn: () => fetchBookmarkPage(userId, 0, null),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const removeMutation = useMutation({
    mutationFn: (bookmarkId: string) => removeBookmark(userId, bookmarkId),
    onSuccess: () => {
      setDeleteConfirmation(null);
      queryClient.invalidateQueries({ queryKey: ['bookmarks', userId] });
    },
    onError: (err) => {
      console.error('Error removing bookmark:', err);
      setDeleteConfirmation(null);
      toast.error('Failed to remove bookmark', {
        icon: '❌',
        duration: 3000
      });
    }
  });

  const moveToFolderMutation = useMutation({
    mutationFn: async ({ bookmarkId, folderId }: { bookmarkId: string; folderId: string | null }) => {
      const { error } = await supabase
        .from('bookmarks')
        .update({ folder_id: folderId })
        .eq('id', bookmarkId)
        .eq('profile_id', userId);

      if (error) throw error;
    },
    onSuccess: (_, { folderId }) => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['folderBookmarks'] });
      toast.success(
        folderId 
          ? 'Novel moved to folder successfully' 
          : 'Novel removed from folder successfully',
        {
          icon: folderId ? '📁' : '↩️',
          duration: 2000
        }
      );
    },
    onError: (error) => {
      console.error('Error moving bookmark:', error);
      toast.error('Failed to move novel to folder', {
        icon: '❌',
        duration: 3000
      });
    }
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent) => {
      if (event === 'SIGNED_IN') {
        queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  // Return early if no userId is provided
  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Icon icon="mdi:account-alert" className="w-16 h-16 mb-4 text-muted-foreground" />
        <p className="text-center text-muted-foreground">
          Please sign in to view your bookmarks
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Icon icon="mdi:alert" className="w-12 h-12 mx-auto mb-2 text-red-500 dark:text-red-400" />
        <p className="text-center text-red-500 dark:text-red-400 mb-4">
          Error loading bookmarks
        </p>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['bookmarks', userId] })}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data?.data || data.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Icon icon="mdi:bookmark-outline" className="w-16 h-16 mb-4 text-muted-foreground" />
        <p className="text-center text-muted-foreground text-lg">
          No bookmarks yet. Start bookmarking your favorite novels!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="relative space-y-4">
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
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
          {data.data.map((bookmark, index) => {
            const columnIndex = index % 3;
            const isSelected = selectedItems.includes(bookmark.id);
            
            return (
              <div 
                key={bookmark.id}
                className={`relative ${mode === 'select' ? 'cursor-pointer' : ''}`}
                onClick={() => {
                  if (mode === 'select') {
                    const newSelectedItems = isSelected
                      ? selectedItems.filter(id => id !== bookmark.id)
                      : [...selectedItems, bookmark.id];
                    onSelectionChange(newSelectedItems);
                  }
                }}
              >
                {mode === 'select' && (
                  <div className={`absolute -top-1.5 -left-1.5 z-20 w-5 h-5 rounded-full ${
                    isSelected 
                      ? 'border-[3px] border-primary' 
                      : 'border-2 border-muted-foreground hover:border-primary'
                  } flex items-center justify-center bg-background transition-colors`}>
                    {isSelected && (
                      <Icon icon="mdi:check" className="w-3 h-3 text-primary" />
                    )}
                  </div>
                )}
                <BookmarkItem
                  bookmark={bookmark}
                  isOwnProfile={isOwnProfile && mode === 'view'}
                  isFirstPage={true}
                  index={index}
                  folders={folders}
                  onMoveToFolder={(bookmarkId, folderId) => 
                    moveToFolderMutation.mutate({ bookmarkId, folderId })
                  }
                  columnIndex={columnIndex}
                />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default memo(BookmarkList); 