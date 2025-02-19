import { Icon } from '@iconify/react';
import { memo, useRef, useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import supabase from '@/lib/supabaseClient';

export interface BookmarkFolder {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

interface CreateFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
}

interface FolderDropdownProps {
  folders: BookmarkFolder[];
  selectedFolderId: string | null;
  onSelect: (folderId: string | null) => void;
}

interface DeleteFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  folderName: string;
}

export const fetchFolders = async (userId: string | undefined) => {
  if (!userId) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('bookmark_folders')
    .select('*')
    .eq('profile_id', userId)
    .order('name');
  
  if (error) throw error;
  return data as BookmarkFolder[];
};

export const CreateFolderDialog = memo(({ isOpen, onClose, onConfirm }: CreateFolderDialogProps) => {
  const [folderName, setFolderName] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 touch-none" onClick={onClose} />
      <div className="relative bg-background rounded-lg p-4 shadow-lg w-full max-w-sm mt-[20vh] sm:mt-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Create New Folder</h3>
          <button
            onClick={onClose}
            className="p-2 -m-2 hover:bg-accent rounded-full transition-colors"
            aria-label="Close dialog"
          >
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (folderName.trim()) {
              onConfirm(folderName.trim());
              setFolderName('');
            }
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="folderName" className="block text-sm font-medium text-muted-foreground mb-1.5">
              Folder Name
            </label>
            <input
              id="folderName"
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Enter folder name"
              className="w-full px-3 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setFolderName('');
                onClose();
              }}
              className="px-4 py-2 rounded-md hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!folderName.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
CreateFolderDialog.displayName = 'CreateFolderDialog';

export const DeleteFolderDialog = memo(({ isOpen, onClose, onConfirm, folderName }: DeleteFolderDialogProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-background rounded-lg p-4 shadow-lg max-w-sm w-full mx-4">
        <h3 className="text-lg font-medium mb-2">Delete Folder</h3>
        <p className="text-muted-foreground mb-4">
          Are you sure you want to delete &quot;{folderName}&quot;? All bookmarks will be moved to Default.
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
DeleteFolderDialog.displayName = 'DeleteFolderDialog';

export const FolderDropdown = memo(({ folders, selectedFolderId, onSelect }: FolderDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [deletingFolder, setDeletingFolder] = useState<BookmarkFolder | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

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
      if (selectedFolderId === deletingFolder?.id) {
        onSelect(null);
      }
      setDeletingFolder(null);
    },
    onError: (error) => {
      console.error('Error deleting folder:', error);
      setDeletingFolder(null);
    }
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedFolder = folders.find(f => f.id === selectedFolderId);

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg border hover:bg-accent/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-label="Select folder"
          title="Select folder"
        >
          <Icon 
            icon={selectedFolder?.icon || 'mdi:bookmark-multiple'} 
            className="w-3.5 h-3.5"
            style={{ color: selectedFolder?.color || 'currentColor' }}
          />
          <span className="text-xs font-medium">{selectedFolder?.name || 'All Bookmarks'}</span>
          <Icon 
            icon={isOpen ? "mdi:chevron-up" : "mdi:chevron-down"} 
            className="w-3.5 h-3.5 text-muted-foreground transition-transform duration-200" 
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-48 py-0.5 bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border divide-y divide-border z-20">
            <div className="px-1.5 py-1 text-[10px] font-medium text-muted-foreground">
              Select Folder
            </div>
            <div className="py-0.5">
              <button
                onClick={() => {
                  onSelect(null);
                  setIsOpen(false);
                }}
                className={`w-full px-1.5 py-1 text-xs text-left hover:bg-accent/50 flex items-center gap-1.5 ${
                  selectedFolderId === null ? 'bg-accent/70 text-primary font-medium' : ''
                }`}
              >
                <Icon icon="mdi:bookmark-multiple" className="w-3.5 h-3.5" />
                <span>All Bookmarks</span>
              </button>
              {folders.map((folder) => (
                <div key={folder.id} className="group relative">
                  <button
                    onClick={() => {
                      onSelect(folder.id);
                      setIsOpen(false);
                    }}
                    className={`w-full px-1.5 py-1 text-xs text-left hover:bg-accent/50 flex items-center gap-1.5 ${
                      selectedFolderId === folder.id ? 'bg-accent/70 text-primary font-medium' : ''
                    }`}
                  >
                    <Icon 
                      icon={folder.icon || 'mdi:folder'} 
                      className="w-3.5 h-3.5"
                      style={{ color: folder.color || 'currentColor' }}
                    />
                    <span className="flex-1">{folder.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingFolder(folder);
                        setIsOpen(false);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-accent/80 rounded-full transition-all duration-200"
                      aria-label={`Delete ${folder.name} folder`}
                      title={`Delete ${folder.name} folder`}
                    >
                      <Icon icon="mdi:trash-can" className="w-3 h-3 text-red-500" />
                    </button>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
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
});
FolderDropdown.displayName = 'FolderDropdown'; 