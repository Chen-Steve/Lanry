import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { ReadingHistory as ReadingHistoryType } from '@/types/database';

export default function ReadingHistorySection() {
  const [history, setHistory] = useState<ReadingHistoryType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReadingHistory();
  }, []);

  const fetchReadingHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('reading_history')
        .select('*, novel:novels(*)')
        .eq('user_id', user.id)
        .order('last_read', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching reading history:', error);
    } finally {
      setLoading(false);
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
      <h2 className="text-xl font-semibold mb-4">Recently Read</h2>
      {history.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No reading history yet. Start reading some novels!
        </p>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between border-b pb-4"
            >
              <div>
                <h3 className="font-medium">{item.novel.title}</h3>
                <p className="text-sm text-gray-500">
                  Last read: Chapter {item.last_chapter}
                </p>
              </div>
              <button
                onClick={() => {/* Add continue reading handler */}}
                className="text-blue-500 hover:text-blue-600"
              >
                Continue Reading
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 