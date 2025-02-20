'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@iconify/react';
import { useState, memo, useCallback } from 'react';
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

  console.log('Raw folders data:', JSON.stringify(folders, null, 2));

  const processedFolders = (folders as unknown as FolderResponse[]).map(folder => {
    console.log(`\nProcessing folder "${folder.name}":`);
    console.log('Bookmarks data:', JSON.stringify(folder.bookmarks, null, 2));
    
    const validCovers = (folder.bookmarks || [])
      .filter(b => {
        console.log('Checking bookmark:', b);
        const isValid = b?.novel && b.novel.cover_image_url;
        console.log('Is valid cover?', isValid);
        return isValid;
      })
      .map(b => b.novel.cover_image_url)
      .filter((url): url is string => url !== null);

    console.log('Valid covers found:', validCovers);

    let coverImage: string | undefined;
    if (validCovers.length > 0) {
      const randomIndex = Math.floor(Math.random() * validCovers.length);
      const randomCover = validCovers[randomIndex];
      coverImage = randomCover;
      console.log('Selected cover:', coverImage);
    } else {
      console.log('No valid covers found for this folder');
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

  return processedFolders;
};

const FolderGrid = ({ userId }: FolderGridProps) => {
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [deletingFolder, setDeletingFolder] = useState<FolderWithCover | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'view' | 'select'>('view');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const handleImageError = useCallback((imageUrl: string) => {
    setFailedImages(prev => {
      const newSet = new Set(prev);
      newSet.add(imageUrl);
      return newSet;
    });
  }, []);

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
    <div className="flex flex-col gap-2">
      {error && (
        <div className="bg-red-500/10 text-red-500 px-3 py-1.5 rounded-md text-xs">
          {error}
        </div>
      )}
      
      <div className="flex flex-col-reverse sm:flex-row items-start gap-4">
        <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'flex flex-col gap-2'} flex-1 w-full`}>
          {folders.map((folder) => (
            <Link 
              key={folder.id}
              href={mode === 'select' ? '#' : `/bookmarks/folder/${folder.id}`}
              className={`group relative rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'p-4 hover:bg-accent/5 border border-border/40 hover:border-border'
                  : 'p-2 hover:bg-accent/10'
              }`}
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
                <div className={`absolute ${viewMode === 'grid' ? 'top-2 left-2' : '-top-0.5 -left-0.5'} z-20 w-4 h-4 rounded-full ${
                  selectedItems.includes(folder.id) 
                    ? 'border-[3px] border-primary' 
                    : 'border-2 border-muted-foreground hover:border-primary'
                } flex items-center justify-center bg-background transition-colors`}>
                  {selectedItems.includes(folder.id) && (
                    <Icon icon="mdi:check" className="w-2.5 h-2.5 text-primary" />
                  )}
                </div>
              )}
              
              <div className={`flex ${viewMode === 'grid' ? 'flex-col gap-4' : 'flex-row gap-3'} items-${viewMode === 'grid' ? 'stretch' : 'center'}`}>
                <div className={`relative ${viewMode === 'grid' ? 'aspect-[4/3] w-full' : 'w-12 h-12'} flex-shrink-0 rounded-md overflow-hidden ${!folder.coverImage || failedImages.has(folder.coverImage) ? 'bg-gradient-to-br from-primary/5 via-primary/10 to-primary/20' : 'bg-primary/10'}`}>
                  {folder.coverImage && !failedImages.has(folder.coverImage) ? (
                    <>
                      <Image 
                        src={folder.coverImage}
                        alt={`Cover for ${folder.name}`}
                        fill
                        sizes={viewMode === 'grid' ? '(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw' : '48px'}
                        className="object-cover"
                        onError={() => {
                          if (folder.coverImage) {
                            console.error('Image failed to load:', folder.coverImage);
                            handleImageError(folder.coverImage);
                          }
                        }}
                        loading="eager"
                        priority={true}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-primary/10 to-primary/20">
                      <Icon 
                        icon={folder.icon || 'mdi:folder'} 
                        className={`${viewMode === 'grid' ? 'w-20 h-20' : 'w-8 h-8'} text-primary/40`}
                      />
                    </div>
                  )}
                  {folder.bookmarkCount > 0 && (
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 text-xs font-medium bg-background/90 backdrop-blur-sm rounded-md text-foreground/90 shadow-sm">
                      {folder.bookmarkCount}
                    </div>
                  )}
                </div>

                <div className={`flex flex-col ${viewMode === 'grid' ? 'gap-1' : 'gap-0.5'} min-w-0 ${viewMode === 'grid' ? '' : 'flex-1'}`}>
                  <div className="flex items-center gap-2">
                    <span className={`font-medium truncate ${viewMode === 'grid' ? 'text-base' : 'text-sm'}`}>
                      {folder.name}
                    </span>
                  </div>
                  {folder.bookmarkCount > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {folder.bookmarkCount} {folder.bookmarkCount === 1 ? 'bookmark' : 'bookmarks'}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="flex items-start justify-end">
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-accent/20 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-background shadow-sm' : 'hover:bg-accent/30'
                }`}
                aria-label="Grid view"
              >
                <Icon icon="mdi:grid" className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-background shadow-sm' : 'hover:bg-accent/30'
                }`}
                aria-label="List view"
              >
                <Icon icon="mdi:format-list-bulleted" className="w-4 h-4" />
              </button>
            </div>

            {mode === 'view' ? (
              <>
                <button
                  onClick={() => handleModeChange('select')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-accent/20 transition-colors text-sm"
                >
                  <Icon icon="mdi:select" className="w-4 h-4" />
                  <span>Select</span>
                </button>
                <button
                  onClick={() => setIsCreateFolderOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm"
                >
                  <Icon icon="mdi:plus" className="w-4 h-4" />
                  <span>New Folder</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleModeChange('view')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-accent/20 transition-colors text-sm"
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
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors text-sm"
                  disabled={selectedItems.length === 0}
                >
                  <Icon icon="mdi:trash-can" className="w-4 h-4" />
                  <span>Delete {selectedItems.length > 0 ? `(${selectedItems.length})` : ''}</span>
                </button>
              </>
            )}
          </div>
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
    </div>
  );
};

export default memo(FolderGrid); 