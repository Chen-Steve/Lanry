'use client';

import React, { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationService, type Notification } from '@/services/notificationService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import { formatRelativeDate } from '@/lib/utils';

interface UserProfile {
  username: string;
  current_streak: number;
  last_visit: string | null;
  coins: number;
  avatar_url?: string;
  role?: string;
}

interface UserProfileButtonProps {
  userProfile: UserProfile | null | undefined;
  isProfileDropdownOpen: boolean;
  setIsProfileDropdownOpen: (isOpen: boolean) => void;
  onSignOut: () => void;
  isMobile?: boolean;
  onMenuClose?: () => void;
}

const UserProfileButton = ({
  userProfile,
  isProfileDropdownOpen,
  setIsProfileDropdownOpen,
  onSignOut,
  isMobile = false,
  onMenuClose
}: UserProfileButtonProps) => {
  console.log('[DEBUG] UserProfileButton rendering at:', new Date().toISOString());
  const router = useRouter();
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const { userId } = useAuth();

  // Fetch unread count on mount and when userId changes
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!userId) return;
      try {
        const count = await notificationService.getUnreadCount(userId);
        setUnreadCount(count);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();
    // Set up polling for unread count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!userId || !showNotifications) return;
      
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
  }, [userId, showNotifications]);

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

  const getInitial = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  const renderAvatar = () => {
    if (userProfile?.avatar_url) {
      return (
        <div className="relative">
          <Image
            src={userProfile.avatar_url}
            alt={userProfile.username}
            width={32}
            height={32}
            unoptimized
            className="w-8 h-8 rounded-full object-cover"
            onError={() => {
              const target = document.querySelector(`img[alt="${userProfile.username}"]`) as HTMLImageElement;
              if (target) {
                target.remove();
              }
            }}
          />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      );
    }
    return (
      <div className="relative">
        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
          {userProfile?.username ? getInitial(userProfile.username) : '?'}
        </div>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>
    );
  };

  const handleRandomNovel = async () => {
    if (isRandomizing) return;
    
    try {
      setIsRandomizing(true);
      const response = await fetch('/api/novels/random');
      const data = await response.json();
      
      if (data.error) {
        console.error('Error fetching random novel:', data.error);
        return;
      }
      
      setIsProfileDropdownOpen(false);
      router.push(`/novels/${data.slug}`);
    } catch (error) {
      console.error('Error fetching random novel:', error);
    } finally {
      setIsRandomizing(false);
    }
  };

  const dropdownContent = (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="p-2 space-y-2"
    >
      {/* Profile Header Section */}
      <div className="p-3 bg-accent/50 rounded-lg">
        <div className="flex items-center gap-3">
          {renderAvatar()}
          <div>
            <div className="font-medium">{userProfile?.username || 'Error loading profile'}</div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Icon icon="ph:coins-fill" className="w-4 h-4 text-amber-500" />
              {userProfile?.coins || 0} coins
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="border-t border-border pt-2">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="flex items-center justify-between w-full px-3 py-2 text-sm text-foreground rounded-md hover:bg-accent transition-colors"
        >
          <div className="flex items-center gap-2">
            <Icon icon="ph:bell-bold" className="text-lg" />
            <span>Notifications</span>
          </div>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
              {unreadCount}
            </span>
          )}
        </button>

        {showNotifications && (
          <div className="mt-2 border-t border-border">
            <div className="p-3 flex items-center justify-between">
              <div className="font-medium text-sm">Recent Notifications</div>
              <Link 
                href="/notifications" 
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setShowNotifications(false);
                  setIsProfileDropdownOpen(false);
                }}
              >
                View All
              </Link>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  <Icon icon="mdi:loading" className="w-6 h-6 mx-auto mb-2 animate-spin" />
                  <p className="text-sm">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
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
        )}
      </div>

      {/* Main Actions */}
      <div className="border-t border-border pt-2">
        <Link
          href="/user-dashboard"
          className="flex items-center gap-2 px-3 py-2 text-sm text-foreground rounded-md hover:bg-accent transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setIsProfileDropdownOpen(false);
            onMenuClose?.();
          }}
        >
          <Icon icon="ph:user" className="text-lg" />
          <span>View Profile</span>
        </Link>

        <Link
          href="/forum"
          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground rounded-md hover:bg-accent transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setIsProfileDropdownOpen(false);
            onMenuClose?.();
          }}
        >
          <Icon icon="ph:chats" className="text-lg" />
          <span>Forum</span>
        </Link>

        {userProfile?.role && (userProfile.role === 'AUTHOR' || userProfile.role === 'TRANSLATOR') && (
          <Link
            href="/author/dashboard"
            className="flex items-center gap-2 px-3 py-2 text-sm text-foreground rounded-md hover:bg-accent transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsProfileDropdownOpen(false);
              onMenuClose?.();
            }}
          >
            <Icon icon="ph:pencil-line" className="text-lg" />
            <span>Author Dashboard</span>
          </Link>
        )}
      </div>

      {/* Quick Actions */}
      <div className="border-t border-border pt-2">
        <button
          onClick={handleRandomNovel}
          disabled={isRandomizing}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground rounded-md hover:bg-accent transition-colors disabled:opacity-50"
        >
          <Icon 
            icon={isRandomizing ? "eos-icons:loading" : "ph:shuffle"} 
            className={`text-lg ${isRandomizing ? 'animate-spin' : ''}`}
          />
          <span>Random Novel</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onSignOut();
            onMenuClose?.();
          }}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors"
        >
          <Icon icon="ph:sign-out" className="text-lg" />
          <span>Sign Out</span>
        </button>
      </div>
    </motion.div>
  );

  if (isMobile) {
    return (
      <div className="relative" ref={profileDropdownRef}>
        <button 
          onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
          className="flex items-center p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
        >
          {renderAvatar()}
        </button>
        {isProfileDropdownOpen && (
          <div className="absolute right-0 top-full mt-1 w-64 bg-background rounded-lg shadow-lg py-1 z-50 border border-border">
            <AnimatePresence>
              {dropdownContent}
            </AnimatePresence>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={profileDropdownRef}>
      <button
        onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
        className="flex items-center gap-2 p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
      >
        {renderAvatar()}
      </button>
      {isProfileDropdownOpen && (
        <div className="absolute right-0 mt-1 w-72 bg-background rounded-lg shadow-lg border border-border overflow-hidden">
          <AnimatePresence>
            {dropdownContent}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default UserProfileButton; 