import { Icon } from '@iconify/react';

interface BulkDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  count: number;
}

export default function BulkDeleteDialog({ isOpen, onClose, onConfirm, count }: BulkDeleteDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-red-500/10 rounded-full">
            <Icon icon="mdi:alert" className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold">Delete Bookmarks</h2>
        </div>
        
        <p className="text-muted-foreground mb-6">
          Are you sure you want to delete {count} selected {count === 1 ? 'bookmark' : 'bookmarks'}? This action cannot be undone.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
} 