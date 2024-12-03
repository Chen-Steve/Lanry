import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { ForumThread } from '@/types/database';
import supabase from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';

interface ThreadListProps {
  categoryId: string;
  onThreadListRef?: (methods: { addThread: (thread: ForumThread) => void }) => void;
}

export default function ThreadList({ categoryId, onThreadListRef }: ThreadListProps) {
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    // Get current user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user?.id || null);
    });
  }, []);

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const response = await fetch(`/api/forum/threads/category/${categoryId}`);
        if (!response.ok) throw new Error('Failed to fetch threads');
        const data = await response.json();
        setThreads(data);
      } catch (error) {
        console.error('Error fetching threads:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchThreads();
  }, [categoryId]);

  useEffect(() => {
    // Expose the addThread method to parent components
    if (onThreadListRef) {
      onThreadListRef({
        addThread: (newThread: ForumThread) => {
          setThreads(currentThreads => [newThread, ...currentThreads]);
        }
      });
    }
  }, [onThreadListRef]);

  const handleDeleteThread = async (threadId: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent the Link navigation
    e.stopPropagation(); // Prevent event bubbling

    if (!window.confirm('Are you sure you want to delete this thread?')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('No access token found');

      const response = await fetch(`/api/forum/threads/${threadId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete thread');

      // Remove the thread from the list
      setThreads(currentThreads => currentThreads.filter(t => t.id !== threadId));
      toast.success('Thread deleted successfully');
    } catch (error) {
      console.error('Error deleting thread:', error);
      toast.error('Failed to delete thread');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading threads...</p>
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="text-center py-8">
        <Icon icon="mdi:forum-outline" className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">No threads in this category yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {threads.map((thread) => (
        <div
          key={thread.id}
          className="border rounded-lg p-4 hover:bg-gray-50 transition"
        >
          <Link href={`/forum/thread/${thread.id}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-black group-hover:text-blue-600 transition">
                  {thread.title}
                </h2>
                <div className="mt-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Icon icon="mdi:account" className="w-4 h-4" />
                    {thread.author.username}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Icon icon="mdi:comment-outline" className="w-4 h-4" />
                    Replies: {thread.reply_count}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Icon icon="mdi:clock-outline" className="w-4 h-4" />
                      {new Date(thread.created_at).toLocaleDateString()} {new Date(thread.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {currentUser === thread.author_id && (
                      <button
                        onClick={(e) => handleDeleteThread(thread.id, e)}
                        className="text-red-500 hover:text-red-700 flex items-center gap-1"
                      >
                        <Icon icon="mdi:delete" className="w-4 h-4" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {thread.is_pinned && (
                <Icon icon="mdi:pin" className="w-5 h-5 text-blue-500" />
              )}
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
} 