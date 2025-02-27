'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { notificationService, type Notification } from '@/services/notificationService';
import { useAuth } from '@/hooks/useAuth';
import { formatRelativeDate } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import supabase from '@/lib/supabaseClient';
import { RealtimePostgresInsertPayload } from '@supabase/supabase-js';

const NotificationButton = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { userId } = useAuth();

  // Set up real-time subscription for notifications
  useEffect(() => {
    if (!userId) return;

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
            setNotifications(prev => [newNotification, ...prev.slice(0, 4)]); // Keep only 5 most recent
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!userId || !isOpen) return;
      
      setIsLoading(true);
      try {
        const data = await notificationService.getNotifications(userId, 5);
        setNotifications(data);
        // Update unread count when notifications are fetched
        const count = await notificationService.getUnreadCount(userId);
        setUnreadCount(count);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [userId, isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mark notification as read when clicked
  const handleNotificationClick = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
      // Update unread count after marking as read
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'comment_reply':
        return 'mdi:reply';
      case 'like':
        return 'mdi:heart';
      case 'system':
        return 'mdi:information';
      case 'chapter_release':
        return 'ph:book-bookmark-bold';
      default:
        return 'mdi:bell';
    }
  };

  const NotificationItem = ({ notification }: { notification: Notification }) => {
    const handleDelete = async (e: React.MouseEvent) => {
      e.preventDefault(); // Prevent the Link from navigating
      e.stopPropagation(); // Prevent event bubbling
      
      try {
        await notificationService.deleteNotification(notification.id);
        setNotifications(notifications.filter(n => n.id !== notification.id));
        // Update unread count if the notification was unread
        if (!notification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      } catch (error) {
        console.error('Error deleting notification:', error);
        toast.error('Failed to delete notification');
      }
    };

    return (
      <Link 
        href={notification.link} 
        className={`group block p-3 ${notification.read ? 'opacity-70' : ''} hover:bg-secondary/50 relative`}
        role="menuitem"
        onClick={() => handleNotificationClick(notification.id)}
      >
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <Icon 
              icon={getNotificationIcon(notification.type)} 
              className="w-5 h-5 text-muted-foreground"
            />
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <p className="text-sm line-clamp-2">{notification.content}</p>
            <p className="text-xs text-muted-foreground">
              {formatRelativeDate(notification.created_at)}
            </p>
          </div>
          <button
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2 p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-full"
            aria-label="Delete notification"
          >
            <Icon icon="ph:trash-bold" className="w-4 h-4" />
          </button>
        </div>
      </Link>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-secondary/80 backdrop-blur-sm p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/90 inline-flex items-center relative"
        aria-label="Toggle notifications"
        aria-controls="notifications-dropdown"
      >
        <Icon icon="ph:bell-bold" className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          id="notifications-dropdown"
          className="absolute right-0 mt-2 w-80 rounded-lg shadow-lg bg-background border border-border overflow-hidden z-50"
          role="menu"
        >
          <div className="flex flex-col max-h-[400px]">
            <div className="p-3 border-b flex items-center justify-between">
              <div className="font-medium">Notifications</div>
              <Link 
                href="/notifications" 
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setIsOpen(false)}
                role="menuitem"
              >
                View All
              </Link>
            </div>
            
            <div className="overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  <Icon icon="mdi:loading" className="w-6 h-6 mx-auto mb-2 animate-spin" />
                  <p className="text-sm">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground" role="menuitem">
                  <Icon icon="ph:bell-slash" className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationButton; 