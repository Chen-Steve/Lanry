import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Novel {
  id: string;
  title: string;
  author: string;
  description: string;
  // Add other novel properties as needed
}

interface Bookmark {
  id: string;
  user_id: string;
  novel_id: string;
  created_at: string;
  novel: Novel;
}

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('bookmarks')
        .select('*, novel:novels(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookmarks(data || []);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async (bookmarkId: string) => {
    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId);

      if (error) throw error;
      setBookmarks(bookmarks.filter((bookmark) => bookmark.id !== bookmarkId));
    } catch (error) {
      console.error('Error removing bookmark:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">My Bookmarks</h2>
      {bookmarks.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No bookmarks yet. Start bookmarking your favorite novels!
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <h3 className="font-medium mb-2">{bookmark.novel.title}</h3>
              <div className="flex justify-between items-center">
                <button
                  onClick={() => {/* Add read handler */}}
                  className="text-blue-500 hover:text-blue-600"
                >
                  Read
                </button>
                <button
                  onClick={() => removeBookmark(bookmark.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 