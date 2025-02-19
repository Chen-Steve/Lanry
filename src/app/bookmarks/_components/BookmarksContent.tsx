'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import supabase from '@/lib/supabaseClient';
import BookmarkList from './BookmarkList';
import FolderGrid from './FolderGrid';
import BulkDeleteDialog from './BulkDeleteDialog';
import BulkMoveDialog from './BulkMoveDialog';
import { Icon } from '@iconify/react';
import { fetchFolders } from './BookmarkFolders';

type Tab = 'bookmarks' | 'folders';
type Mode = 'view' | 'select';

export default function BookmarksContent() {
  const [activeTab, setActiveTab] = useState<Tab>('bookmarks');
  const [mode, setMode] = useState<Mode>('view');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [userId, setUserId] = useState<string>();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Get initial auth state
  useEffect(() => {
    const getInitialUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id);
    };
    getInitialUser();
  }, []);

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setUserId(session?.user?.id);
        // Invalidate queries when auth state changes
        queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
        queryClient.invalidateQueries({ queryKey: ['bookmarkFolders'] });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const { data: folders = [] } = useQuery({
    queryKey: ['bookmarkFolders', userId],
    queryFn: () => fetchFolders(userId),
    enabled: !!userId,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    if (newMode === 'view') {
      setSelectedItems([]);
    }
  };

  const bulkDeleteMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .in('id', selectedItems);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['bookmarkFolders'] });
      setSelectedItems([]);
      setIsDeleteDialogOpen(false);
      handleModeChange('view');
    },
    onError: (error) => {
      console.error('Error deleting bookmarks:', error);
      setIsDeleteDialogOpen(false);
    }
  });

  const bulkMoveMutation = useMutation({
    mutationFn: async (folderId: string | null) => {
      if (!userId) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('bookmarks')
        .update({ folder_id: folderId })
        .in('id', selectedItems);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['bookmarkFolders'] });
      setSelectedItems([]);
      setIsMoveDialogOpen(false);
      handleModeChange('view');
    },
    onError: (error) => {
      console.error('Error moving bookmarks:', error);
      setIsMoveDialogOpen(false);
    }
  });

  const handleBulkDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleBulkMove = () => {
    setIsMoveDialogOpen(true);
  };

  return (
    <main className="container max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Icon icon="mdi:bookmark-multiple" className="w-6 h-6" />
          My Bookmarks
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage and organize your bookmarked novels
        </p>
      </div>

      {/* Navigation and Actions */}
      <div className="border-b mb-6">
        <div className="flex items-center justify-between">
          {/* Tabs */}
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                activeTab === 'bookmarks'
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              All Bookmarks
            </button>
            <button
              onClick={() => setActiveTab('folders')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                activeTab === 'folders'
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              Folders
            </button>
          </div>

          {/* Action Buttons */}
          {activeTab === 'bookmarks' && (
            <div className="flex items-center gap-2">
              {mode === 'view' ? (
                <button
                  onClick={() => handleModeChange('select')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-accent transition-colors text-sm"
                >
                  <Icon icon="mdi:select" className="w-4 h-4" />
                  <span>Select</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleModeChange('view')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-accent transition-colors text-sm"
                  >
                    <Icon icon="mdi:close" className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-accent transition-colors text-sm text-red-500 hover:text-red-600"
                    disabled={selectedItems.length === 0}
                  >
                    <Icon icon="mdi:trash-can" className="w-4 h-4" />
                    <span>Delete {selectedItems.length > 0 ? `(${selectedItems.length})` : ''}</span>
                  </button>
                  <button
                    onClick={handleBulkMove}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-accent transition-colors text-sm"
                    disabled={selectedItems.length === 0}
                  >
                    <Icon icon="mdi:folder-move" className="w-4 h-4" />
                    <span>Move {selectedItems.length > 0 ? `(${selectedItems.length})` : ''}</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {activeTab === 'bookmarks' && (
        <BookmarkList 
          userId={userId} 
          isOwnProfile={true}
          mode={mode}
          selectedItems={selectedItems}
          onSelectionChange={setSelectedItems}
        />
      )}
      {activeTab === 'folders' && (
        <FolderGrid userId={userId} />
      )}

      <BulkDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => bulkDeleteMutation.mutate()}
        count={selectedItems.length}
      />

      <BulkMoveDialog
        isOpen={isMoveDialogOpen}
        onClose={() => setIsMoveDialogOpen(false)}
        onConfirm={(folderId) => bulkMoveMutation.mutate(folderId)}
        count={selectedItems.length}
        folders={folders}
      />
    </main>
  );
} 