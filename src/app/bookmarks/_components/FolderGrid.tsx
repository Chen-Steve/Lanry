'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@iconify/react';
import { useState, memo } from 'react';
import Link from 'next/link';
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
  showNewFolderButton?: boolean;
  onNewFolderRequest?: () => void;
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

const FolderGrid = ({ userId, showNewFolderButton = true, onNewFolderRequest }: FolderGridProps) => {
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [deletingFolder, setDeletingFolder] = useState<FolderWithCover | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleOpenCreateFolder = () => {
    setIsCreateFolderOpen(true);
    
    if (onNewFolderRequest) {
      onNewFolderRequest();
    }
  };

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
      
      <div className="relative space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 w-full">
          {folders.map((folder) => (
            <Link 
              key={folder.id}
              href={`/bookmarks/folder/${folder.id}`}
              className="group relative rounded-lg transition-all p-0 hover:bg-accent/5 border border-border/40 hover:border-border max-w-[220px] mx-auto w-full"
            >
              {/* Edit button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // TODO: Open edit dialog or handle edit action
                  console.log('Edit folder:', folder.id);
                }}
                className="absolute top-2 left-2 z-20 w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm shadow-sm flex items-center justify-center sm:opacity-0 opacity-100 sm:group-hover:opacity-100 transition-opacity hover:bg-background"
                aria-label={`Edit ${folder.name}`}
              >
                <Icon icon="mdi:pencil" className="w-3.5 h-3.5 text-foreground/70" />
              </button>
              
              <div className="flex flex-col gap-4 items-stretch">
                <div className="relative aspect-[4/3] w-full flex-shrink-0 rounded-md overflow-hidden">
                  <div 
                    className="absolute inset-0"
                    style={{
                      background: `repeating-linear-gradient(
                        45deg,
                        ${folder.color || '#7c3aed'}1a,
                        ${folder.color || '#7c3aed'}1a 10px,
                        ${folder.color || '#7c3aed'}30 10px,
                        ${folder.color || '#7c3aed'}30 20px
                      )`
                    }}
                  >
                  </div>
                  
                  {/* Centered folder name */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-medium truncate text-base px-2 py-1 bg-background/80 backdrop-blur-sm rounded-md shadow-sm max-w-[90%] text-center">
                      {folder.name}
                    </span>
                  </div>
                  
                  {folder.bookmarkCount > 0 && (
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 text-xs font-medium bg-background/90 backdrop-blur-sm rounded-md text-foreground/90 shadow-sm">
                      {folder.bookmarkCount}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Floating Action Button */}
        {showNewFolderButton && (
          <div className="fixed sm:absolute bottom-[7.5rem] sm:bottom-4 right-4 flex gap-2 z-50">
            <button
              onClick={handleOpenCreateFolder}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium shadow-lg hover:bg-primary/90 transition-colors"
            >
              <Icon icon="mdi:plus" className="w-4 h-4" />
              <span>New Folder</span>
            </button>
          </div>
        )}
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

export { CreateFolderDialog };

export default memo(FolderGrid); 