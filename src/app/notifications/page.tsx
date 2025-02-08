'use client';

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  link?: string;
  type: 'system' | 'comment' | 'like' | 'follow';
}

const NotificationsPage = () => {
  const [notifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<Notification['type'] | 'all'>('all');
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

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
      case 'system':
        return 'ph:gear-bold';
      case 'comment':
        return 'ph:chat-bold';
      case 'like':
        return 'ph:heart-bold';
      case 'follow':
        return 'ph:user-plus-bold';
      default:
        return 'ph:bell-bold';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Notifications</h1>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'system', 'comment', 'like', 'follow'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type as Notification['type'] | 'all')}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              filter === type
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {paginatedNotifications.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Icon icon="ph:bell-slash" className="w-12 h-12 mx-auto mb-4" />
            <p>No notifications found</p>
          </div>
        ) : (
          paginatedNotifications.map((notification) => (
            <Link
              key={notification.id}
              href={notification.link || '#'}
              className={`block p-4 rounded-lg ${
                notification.read ? 'bg-secondary/50' : 'bg-secondary'
              } hover:bg-secondary/80 transition-colors`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <Icon 
                    icon={getNotificationIcon(notification.type)} 
                    className="w-6 h-6 text-muted-foreground"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{notification.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(notification.timestamp).toLocaleDateString()}
                  </p>
                </div>
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