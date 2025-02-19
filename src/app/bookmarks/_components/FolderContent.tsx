'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { useAuth } from '@/hooks/useAuth';
import supabase from '@/lib/supabaseClient';
import BookmarkItem from './BookmarkItem';

interface Novel {
  id: string;
  title: string;
  slug: string | null;
  cover_image_url: string;
}

interface Bookmark {
  id: string;
  profileId: string;
  novelId: string;
  createdAt: string;
  novel: Novel;
}

interface BookmarkRow {
  id: string;
  profile_id: string;
  novel_id: string;
  created_at: string;
  novel: {
    id: string;
    title: string;
    slug: string | null;
    cover_image_url: string;
  };
}

const fetchFolderBookmarks = async (folderId: string, userId: string | null) => {
  if (!userId) throw new Error('Not authenticated');

  const [{ data: folder, error: folderError }, { data: bookmarks, error: bookmarksError }] = await Promise.all([
    supabase
      .from('bookmark_folders')
      .select('name')
      .eq('id', folderId)
      .single(),
    supabase
      .from('bookmarks')
      .select(`
        id,
        created_at,
        profile_id,
        novel_id,
        novel:novels (
          id,
          title,
          slug,
          cover_image_url
        )
      `)
      .eq('folder_id', folderId)
      .eq('profile_id', userId)
      .order('created_at', { ascending: false })
  ]);

  if (folderError) throw folderError;
  if (bookmarksError) throw bookmarksError;

  const typedBookmarks = (bookmarks || []) as unknown as BookmarkRow[];
  
  return {
    folderName: folder?.name,
    bookmarks: typedBookmarks.map(bookmark => ({
      id: bookmark.id,
      profileId: bookmark.profile_id,
      novelId: bookmark.novel_id,
      createdAt: bookmark.created_at,
      novel: bookmark.novel
    }))
  };
};

export default function FolderContent() {
  const { userId } = useAuth();
  const router = useRouter();
  const { id: folderId } = useParams();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['folderBookmarks', folderId, userId],
    queryFn: () => fetchFolderBookmarks(folderId as string, userId),
    enabled: !!folderId && !!userId,
  });

  const deleteBookmarkMutation = useMutation({
    mutationFn: async (bookmarkId: string) => {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folderBookmarks'] });
    },
    onError: (error) => {
      console.error('Error deleting bookmark:', error);
    }
  });

  const handleDeleteBookmark = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to remove "${title}" from your bookmarks?`)) {
      deleteBookmarkMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <Icon icon="mdi:alert" className="w-12 h-12 mx-auto mb-2 text-red-500 dark:text-red-400" />
        <p className="text-red-500 dark:text-red-400">Error loading folder bookmarks</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="container max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-accent/10 transition-colors"
          aria-label="Go back"
        >
          <Icon icon="mdi:arrow-left" className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold">{data.folderName}</h1>
      </div>

      {data.bookmarks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Icon icon="mdi:folder-open" className="w-12 h-12 mx-auto mb-2" />
          <p>No bookmarks in this folder</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
          {data.bookmarks.map((bookmark, index) => (
            <BookmarkItem
              key={bookmark.id}
              bookmark={bookmark}
              isOwnProfile={true}
              onDeleteClick={handleDeleteBookmark}
              isFirstPage={true}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
} 