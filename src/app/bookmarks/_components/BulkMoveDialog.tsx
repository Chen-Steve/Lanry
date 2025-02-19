import { Icon } from '@iconify/react';
import { useState } from 'react';
import type { BookmarkFolder } from './BookmarkFolders';

interface BulkMoveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (folderId: string | null) => void;
  count: number;
  folders: BookmarkFolder[];
}

export default function BulkMoveDialog({ isOpen, onClose, onConfirm, count, folders }: BulkMoveDialogProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Icon icon="mdi:folder-move" className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Move Bookmarks</h2>
        </div>
        
        <p className="text-muted-foreground mb-4">
          Move {count} selected {count === 1 ? 'bookmark' : 'bookmarks'} to:
        </p>

        <div className="space-y-2 mb-6">
          <button
            onClick={() => setSelectedFolderId(null)}
            className={`w-full px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              selectedFolderId === null ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
            }`}
          >
            <Icon icon="mdi:bookmark-multiple" className="w-4 h-4" />
            <span>Default (No Folder)</span>
          </button>
          {folders.map(folder => (
            <button
              key={folder.id}
              onClick={() => setSelectedFolderId(folder.id)}
              className={`w-full px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                selectedFolderId === folder.id ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
              }`}
            >
              <Icon 
                icon={folder.icon || 'mdi:folder'} 
                className="w-4 h-4"
                style={{ color: folder.color || 'currentColor' }}
              />
              <span>{folder.name}</span>
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selectedFolderId)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Move
          </button>
        </div>
      </div>
    </div>
  );
} 