'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { notificationService, type Notification } from '@/services/notificationService';
import { useAuth } from '@/hooks/useAuth';
import { formatRelativeDate } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import supabase from '@/lib/supabaseClient';
import { RealtimePostgresInsertPayload } from '@supabase/supabase-js';

type NotificationType = Notification['type'];

const NOTIFICATION_FILTERS: { label: string; value: NotificationType | 'all'; icon: string }[] = [
  { label: 'All', value: 'all', icon: 'ph:bell-bold' },
  { label: 'Chapters', value: 'chapter_release', icon: 'ph:book-bookmark-bold' },
  { label: 'Comments', value: 'comment_reply', icon: 'ph:chat-bold' },
  { label: 'Likes', value: 'like', icon: 'ph:heart-bold' },
  { label: 'System', value: 'system', icon: 'ph:info-bold' }
];

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<NotificationType | 'all'>('all');
  const [page, setPage] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const itemsPerPage = 20;
  const { userId } = useAuth();

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      try {
        const data = await notificationService.getNotifications(userId, 100);
        setNotifications(data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        toast.error('Failed to load notifications');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();

    // Set up real-time subscription for new notifications
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`
        },
        async (payload: RealtimePostgresInsertPayload<Notification>) => {
          // Fetch the complete notification with sender and novel data
          const { data: newNotification } = await supabase
            .from('notifications')
            .select(`
              *,
              sender:profiles!sender_id (
                username,
                avatar_url
              ),
              novel:novels (
                chapters (
                  publish_at,
                  created_at
                )
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (newNotification) {
            setNotifications(prev => [newNotification, ...prev]);
          }
        }
      )
      .subscribe();

    // Set up polling as a fallback (every 30 seconds)
    const pollInterval = setInterval(fetchNotifications, 30000);

    return () => {
      subscription.unsubscribe();
      clearInterval(pollInterval);
    };
  }, [userId]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(notifications.filter(n => n.id !== notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    const filterConfig = NOTIFICATION_FILTERS.find(f => f.value === type);
    return filterConfig?.icon || 'ph:bell-bold';
  };

  const filteredNotifications = notifications.filter(
    notification => filter === 'all' || notification.type === filter
  );

  const paginatedNotifications = filteredNotifications.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);

  const NotificationCard = ({ notification }: { notification: Notification }) => (
    <Link
      href={notification.link}
      className={`group block p-4 rounded-lg ${
        notification.read ? 'bg-secondary/50' : 'bg-secondary'
      } hover:bg-secondary/80 transition-colors relative`}
      onClick={() => !notification.read && handleMarkAsRead(notification.id)}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <Icon 
            icon={getNotificationIcon(notification.type)} 
            className={`w-5 h-5 ${notification.read ? 'text-muted-foreground' : 'text-primary'}`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm line-clamp-2 ${notification.read ? 'text-muted-foreground' : ''}`}>
            {notification.content}
          </p>
          <div className="flex items-center gap-2 mt-2">
            {notification.sender && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {notification.sender.avatar_url && (
                  <img 
                    src={notification.sender.avatar_url} 
                    alt={notification.sender.username || 'User'} 
                    className="rounded-full w-4 h-4 object-cover"
                  />
                )}
                <span>{notification.sender.username || 'Unknown user'}</span>
              </div>
            )}
            <span className="text-xs text-muted-foreground">
              {formatRelativeDate(notification.created_at)}
            </span>
          </div>
        </div>
        <button
          onClick={(e) => handleDelete(notification.id, e)}
          className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2 p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-full"
          aria-label="Delete notification"
        >
          <Icon icon="ph:trash-bold" className="w-4 h-4" />
        </button>
      </div>
    </Link>
  );

  if (!userId) {
    return (
      <div className="max-w-4xl mx-auto p-4 text-center py-12 text-muted-foreground">
        <Icon icon="ph:sign-in" className="w-12 h-12 mx-auto mb-4" />
        <p>Please sign in to view notifications</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {notifications.length > 0 && (
          <div className="flex items-center gap-4">
            <button
              onClick={async () => {
                try {
                  await notificationService.markAllAsRead(userId);
                  setNotifications(notifications.map(n => ({ ...n, read: true })));
                  toast.success('All notifications marked as read');
                } catch (error) {
                  console.error('Error marking all as read:', error);
                  toast.error('Failed to mark all as read');
                }
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Mark all as read
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-sm text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
            >
              <Icon icon="ph:trash-bold" className="w-4 h-4" />
              Delete all
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4 space-y-4 shadow-lg">
            <div className="flex items-center gap-3 text-red-500">
              <Icon icon="ph:warning-circle-bold" className="w-6 h-6" />
              <h2 className="text-lg font-semibold">Delete All Notifications</h2>
            </div>
            <p className="text-muted-foreground">
              Are you sure you want to delete all notifications? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await notificationService.deleteAllNotifications(userId);
                    setNotifications([]);
                    toast.success('All notifications deleted');
                  } catch (error) {
                    console.error('Error deleting all notifications:', error);
                    toast.error('Failed to delete all notifications');
                  } finally {
                    setShowDeleteConfirm(false);
                  }
                }}
                className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {NOTIFICATION_FILTERS.map((filterConfig) => (
          <button
            key={filterConfig.value}
            onClick={() => setFilter(filterConfig.value)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap flex items-center gap-2 transition-colors ${
              filter === filterConfig.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon icon={filterConfig.icon} className="w-4 h-4" />
            {filterConfig.label}
            {filterConfig.value !== 'all' && (
              <span className="text-xs">
                ({notifications.filter(n => n.type === filterConfig.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {/* Permanent System Notice */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <Icon 
              icon="ph:warning-circle-bold" 
              className="w-6 h-6 text-yellow-500 flex-shrink-0"
            />
            <p className="text-sm text-yellow-700">
              Please do not share the website&apos;s link anywhere except for NovelUpdates.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            <Icon icon="ph:circle-notch" className="w-12 h-12 mx-auto mb-4 animate-spin" />
            <p>Loading notifications...</p>
          </div>
        ) : paginatedNotifications.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Icon icon="ph:bell-slash" className="w-12 h-12 mx-auto mb-4" />
            <p>No notifications found</p>
          </div>
        ) : (
          paginatedNotifications.map((notification) => (
            <NotificationCard key={notification.id} notification={notification} />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`w-8 h-8 rounded-full text-sm ${
                page === i + 1
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage; 