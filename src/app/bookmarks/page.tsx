import { Suspense } from 'react';
import BookmarksContent from './_components/BookmarksContent';

export const metadata = {
  title: 'My Bookmarks',
  description: 'Manage your bookmarked novels',
};

export default function BookmarksPage() {
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
      <BookmarksContent />
    </Suspense>
  );
} 