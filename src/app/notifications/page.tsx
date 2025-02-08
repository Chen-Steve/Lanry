'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { notificationService, type Notification } from '@/services/notificationService';
import { useAuth } from '@/hooks/useAuth';
import { formatRelativeDate } from '@/lib/utils';
import { toast } from 'react-hot-toast';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<Notification['type'] | 'all'>('all');
  const [page, setPage] = useState(1);
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

  const filteredNotifications = notifications.filter(
    notification => filter === 'all' || notification.type === filter
  );

  const paginatedNotifications = filteredNotifications.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'comment_reply':
        return 'ph:chat-bold';
      case 'like':
        return 'ph:heart-bold';
      case 'follow':
        return 'ph:user-plus-bold';
      case 'system':
        return 'ph:gear-bold';
      default:
        return 'ph:bell-bold';
    }
  };

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
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'comment_reply', 'like', 'follow', 'system'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type as Notification['type'] | 'all')}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              filter === type
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {type === 'comment_reply' ? 'Comments' : type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
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
            <Link
              key={notification.id}
              href={notification.link}
              className={`group block p-4 rounded-lg ${
                notification.read ? 'bg-secondary/50' : 'bg-secondary'
              } hover:bg-secondary/80 transition-colors relative`}
              onClick={() => !notification.read && handleMarkAsRead(notification.id)}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <Icon 
                    icon={getNotificationIcon(notification.type)} 
                    className="w-6 h-6 text-muted-foreground"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-clamp-2">{notification.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatRelativeDate(notification.created_at)}
                  </p>
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
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-50"
            aria-label="Previous page"
          >
            <Icon icon="ph:caret-left-bold" className="w-5 h-5" />
          </button>
          <span className="flex items-center px-4 text-sm">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-50"
            aria-label="Next page"
          >
            <Icon icon="ph:caret-right-bold" className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage; 