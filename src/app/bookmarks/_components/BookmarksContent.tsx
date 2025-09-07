'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import supabase from '@/lib/supabaseClient';
import { useSupabase } from '@/app/providers';
import BookmarkList from './BookmarkList';
import FolderGrid from './FolderGrid';
import BulkDeleteDialog from './BulkDeleteDialog';
import BulkMoveDialog from './BulkMoveDialog';
import { Icon } from '@iconify/react';
import { fetchFolders, CreateFolderDialog } from './BookmarkFolders';

type Tab = 'bookmarks' | 'folders';
type Mode = 'view' | 'select';

export default function BookmarksContent() {
  const { user } = useSupabase();
  const [activeTab, setActiveTab] = useState<Tab>('bookmarks');
  const [mode, setMode] = useState<Mode>('view');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [userId, setUserId] = useState<string>();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const queryClient = useQueryClient();

  // Derive auth from context
  useEffect(() => {
    setUserId(user?.id);
    // Invalidate queries when auth state changes
    queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    queryClient.invalidateQueries({ queryKey: ['bookmarkFolders'] });
  }, [user, queryClient]);

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

  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!userId) throw new Error('Not authenticated');

      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('bookmark_folders')
        .insert({
          id,
          name,
          profile_id: userId,
          icon: 'mdi:folder',
          created_at: now,
          updated_at: now,
          description: null,
          parent_folder_id: null
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        if (error.code === '23505') {
          throw new Error('A folder with this name already exists');
        }
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarkFolders'] });
      setIsCreateFolderOpen(false);
    },
    onError: (error: Error) => {
      console.error('Error creating folder:', error);
    }
  });

  return (
    <main className="container max-w-5xl mx-auto px-4 py-6">
      {/* Navigation and Actions */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          {/* Tabs */}
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`px-4 py-2 text-base rounded-md transition-colors ${
                activeTab === 'bookmarks'
                  ? 'bg-container font-medium'
                  : 'bg-container hover:bg-[#faf7f2] dark:hover:bg-zinc-700'
              }`}
            >
              Bookmarks
            </button>
            <button
              onClick={() => setActiveTab('folders')}
              className={`px-4 py-2 text-base rounded-md transition-colors ${
                activeTab === 'folders'
                  ? 'bg-container font-medium'
                  : 'bg-container hover:bg-[#faf7f2] dark:hover:bg-zinc-700'
              }`}
            >
              Folders
            </button>
          </div>
          
          {/* Action Buttons */}
          {activeTab === 'bookmarks' && mode === 'view' && (
            <button
              onClick={() => handleModeChange('select')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Icon icon="mdi:pencil" className="w-4 h-4" />
              <span>Edit</span>
            </button>
          )}
          
          {activeTab === 'bookmarks' && mode === 'select' && (
            <div className="flex gap-2">
              <button
                onClick={() => handleModeChange('view')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md bg-background text-foreground hover:bg-accent/50 transition-colors"
              >
                <Icon icon="mdi:close" className="w-4 h-4" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md bg-background text-red-500 hover:bg-accent/50 transition-colors"
                disabled={selectedItems.length === 0}
              >
                <Icon icon="mdi:trash-can" className="w-4 h-4" />
                <span>Delete {selectedItems.length > 0 ? `(${selectedItems.length})` : ''}</span>
              </button>
              <button
                onClick={handleBulkMove}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                disabled={selectedItems.length === 0}
              >
                <Icon icon="mdi:folder-open" className="w-4 h-4" />
                <span>Move {selectedItems.length > 0 ? `(${selectedItems.length})` : ''}</span>
              </button>
            </div>
          )}
          
          {activeTab === 'folders' && (
            <button
              onClick={() => setIsCreateFolderOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Icon icon="mdi:plus" className="w-4 h-4" />
              <span>New Folder</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'bookmarks' && (
        <div className="bg-container rounded-lg p-4">
          <BookmarkList 
            userId={userId} 
            isOwnProfile={true}
            mode={mode}
            selectedItems={selectedItems}
            onSelectionChange={(items) => {
              setSelectedItems(items);
              if (items.length === 0 && mode === 'select') {
                handleModeChange('view');
              }
            }}
          />
        </div>
      )}
      {activeTab === 'folders' && (
        <div className="bg-container rounded-lg p-4">
          <FolderGrid 
            userId={userId} 
            showNewFolderButton={false}
            onNewFolderRequest={() => setIsCreateFolderOpen(true)}
          />
        </div>
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

      <CreateFolderDialog
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        onConfirm={(name) => createFolderMutation.mutate(name)}
      />
    </main>
  );
} 