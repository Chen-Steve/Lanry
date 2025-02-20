'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@iconify/react';
import { useState, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CreateFolderDialog, DeleteFolderDialog, type BookmarkFolder } from './BookmarkFolders';
import supabase from '@/lib/supabaseClient';

// UUID v4 generation function
function generateUUID() {
  let dt = new Date().getTime();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (dt + Math.random()*16)%16 | 0;
    dt = Math.floor(dt/16);
    return (c === 'x' ? r : (r&0x3|0x8)).toString(16);
  });
}

interface FolderGridProps {
  userId: string | undefined;
}

interface FolderWithCover extends BookmarkFolder {
  bookmarkCount: number;
  coverImage?: string;
}

interface FolderResponse {
  id: string;
  name: string;
  icon: string | undefined;
  color: string | undefined;
  bookmarks: {
    id: string;
    novel: {
      cover_image_url: string | null;
    };
  }[];
}

const fetchFoldersWithCovers = async (userId: string | undefined): Promise<FolderWithCover[]> => {
  if (!userId) throw new Error('Not authenticated');

  const { data: folders, error } = await supabase
    .from('bookmark_folders')
    .select(`
      id,
      name,
      icon,
      color,
      bookmarks!folder_id (
        id,
        novel:novels!novel_id (
          cover_image_url
        )
      )
    `)
    .eq('profile_id', userId)
    .order('name');

  if (error) throw error;

  console.log('Raw folders data:', folders);

  const processedFolders = (folders as unknown as FolderResponse[]).map(folder => {
    console.log('Processing folder:', folder.name, 'Bookmarks:', folder.bookmarks);
    
    const validCovers = (folder.bookmarks || [])
      .filter(b => b?.novel && b.novel.cover_image_url)
      .map(b => b.novel.cover_image_url)
      .filter((url): url is string => url !== null);

    console.log('Valid covers for folder:', folder.name, validCovers);

    let coverImage: string | undefined;
    if (validCovers.length > 0) {
      const randomIndex = Math.floor(Math.random() * validCovers.length);
      const randomCover = validCovers[randomIndex];
      coverImage = randomCover;
      console.log('Selected cover for folder:', folder.name, coverImage);
    }

    return {
      id: folder.id,
      name: folder.name,
      icon: folder.icon || undefined,
      color: folder.color || undefined,
      bookmarkCount: (folder.bookmarks || []).length,
      coverImage
    };
  });

  console.log('Processed folders:', processedFolders);
  return processedFolders;
};

const FolderGrid = ({ userId }: FolderGridProps) => {
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [deletingFolder, setDeletingFolder] = useState<FolderWithCover | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'view' | 'select'>('view');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: folders = [], isLoading, error: fetchError } = useQuery({
    queryKey: ['bookmarkFolders', userId],
    queryFn: () => fetchFoldersWithCovers(userId),
    enabled: !!userId,
  });

  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!userId) throw new Error('Not authenticated');

      const id = generateUUID();
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
      setError(null);
    },
    onError: (error: Error) => {
      console.error('Error creating folder:', error);
      setError(error.message || 'Failed to create folder');
    }
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId: string) => {
      // First, move all bookmarks in this folder to no folder (null)
      const { error: updateError } = await supabase
        .from('bookmarks')
        .update({ folder_id: null })
        .eq('folder_id', folderId);

      if (updateError) throw updateError;

      // Then delete the folder
      const { error: deleteError } = await supabase
        .from('bookmark_folders')
        .delete()
        .eq('id', folderId);

      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarkFolders'] });
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      setDeletingFolder(null);
    },
    onError: (error) => {
      console.error('Error deleting folder:', error);
      setDeletingFolder(null);
    }
  });

  const handleModeChange = (newMode: 'view' | 'select') => {
    setMode(newMode);
    if (newMode === 'view') {
      setSelectedItems([]);
    }
  };

  const bulkDeleteMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Not authenticated');

      // First, move all bookmarks in these folders to no folder (null)
      const { error: updateError } = await supabase
        .from('bookmarks')
        .update({ folder_id: null })
        .in('folder_id', selectedItems);

      if (updateError) throw updateError;

      // Then delete the folders
      const { error: deleteError } = await supabase
        .from('bookmark_folders')
        .delete()
        .in('id', selectedItems);

      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarkFolders'] });
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      setSelectedItems([]);
      setDeletingFolder(null);
      handleModeChange('view');
    },
    onError: (error) => {
      console.error('Error deleting folders:', error);
      setDeletingFolder(null);
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="text-center py-8">
        <Icon icon="mdi:alert" className="w-12 h-12 mx-auto mb-2 text-red-500 dark:text-red-400" />
        <p className="text-red-500 dark:text-red-400">Error loading folders</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {error && (
          <div className="bg-red-500/10 text-red-500 px-3 py-1.5 rounded-md text-xs">
            {error}
          </div>
        )}
        <div className="flex justify-end items-center gap-2">
          {mode === 'view' ? (
            <>
              <button
                onClick={() => handleModeChange('select')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-accent transition-colors text-sm"
              >
                <Icon icon="mdi:select" className="w-4 h-4" />
                <span>Select</span>
              </button>
              <button
                onClick={() => setIsCreateFolderOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md border bg-primary/5 hover:bg-primary/10 text-primary transition-colors duration-200 text-sm"
              >
                <Icon icon="mdi:plus" className="w-4 h-4" />
                <span>New Folder</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleModeChange('view')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-accent transition-colors text-sm"
              >
                <Icon icon="mdi:close" className="w-4 h-4" />
                <span>Cancel</span>
              </button>
              <button
                onClick={() => {
                  if (selectedItems.length > 0) {
                    bulkDeleteMutation.mutate();
                  }
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-accent transition-colors text-sm text-red-500 hover:text-red-600"
                disabled={selectedItems.length === 0}
              >
                <Icon icon="mdi:trash-can" className="w-4 h-4" />
                <span>Delete {selectedItems.length > 0 ? `(${selectedItems.length})` : ''}</span>
              </button>
            </>
          )}
        </div>

        <div className="flex flex-col gap-1">
          {folders.map((folder) => (
            <Link 
              key={folder.id}
              href={mode === 'select' ? '#' : `/bookmarks/folder/${folder.id}`}
              className="group relative flex items-center gap-3 py-1.5 px-2.5 hover:bg-accent/10 rounded-md transition-colors"
              onClick={(e) => {
                if (mode === 'select') {
                  e.preventDefault();
                  setSelectedItems(prev => 
                    prev.includes(folder.id) 
                      ? prev.filter(id => id !== folder.id)
                      : [...prev, folder.id]
                  );
                }
              }}
            >
              {mode === 'select' && (
                <div className={`absolute -top-0.5 -left-0.5 z-20 w-4 h-4 rounded-full ${
                  selectedItems.includes(folder.id) 
                    ? 'border-[3px] border-primary' 
                    : 'border-2 border-muted-foreground hover:border-primary'
                } flex items-center justify-center bg-background transition-colors`}>
                  {selectedItems.includes(folder.id) && (
                    <Icon icon="mdi:check" className="w-2.5 h-2.5 text-primary" />
                  )}
                </div>
              )}
              <div className="relative w-12 h-12 flex-shrink-0 rounded-md overflow-hidden bg-primary/10">
                {folder.coverImage ? (
                  <Image 
                    src={folder.coverImage}
                    alt={`Cover for ${folder.name}`}
                    fill
                    sizes="48px"
                    className="object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/default-cover.jpg';
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon icon="mdi:folder" className="w-6 h-6 text-primary/40" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">
                  {folder.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <CreateFolderDialog
        isOpen={isCreateFolderOpen}
        onClose={() => {
          setIsCreateFolderOpen(false);
          setError(null);
        }}
        onConfirm={(name) => createFolderMutation.mutate(name)}
      />

      <DeleteFolderDialog
        isOpen={!!deletingFolder}
        onClose={() => setDeletingFolder(null)}
        onConfirm={() => {
          if (deletingFolder) {
            deleteFolderMutation.mutate(deletingFolder.id);
          }
        }}
        folderName={deletingFolder?.name || ''}
      />
    </>
  );
};

export default memo(FolderGrid); 