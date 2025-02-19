import { Suspense } from 'react';
import FolderContent from '../../_components/FolderContent';

export const metadata = {
  title: 'Folder Bookmarks',
  description: 'View bookmarks in this folder',
};

export default function FolderPage() {
  return (
    <Suspense
      fallback={
        <div className="container max-w-5xl mx-auto px-4 py-6">
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </div>
      }
    >
      <FolderContent />
    </Suspense>
  );
} 