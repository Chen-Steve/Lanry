import supabase from '@/lib/supabaseClient';
import { generateUUID } from '@/lib/utils';

export interface Notification {
  id: string;
  recipient_id: string;
  sender_id: string;
  type: 'comment_reply' | 'like' | 'system' | 'chapter_release';
  content: string;
  link: string;
  read: boolean;
  created_at: string;
  updated_at: string;
  novel_id?: string;
  comment_id?: string;
  sender?: {
    username: string | null;
    avatar_url: string | null;
  };
  novel?: {
    chapters: Array<{
      publish_at: string | null;
    }>;
  };
}

export const notificationService = {
  async createNotification({
    recipientId,
    senderId,
    type,
    content,
    link,
    novelId,
    commentId
  }: {
    recipientId: string;
    senderId: string;
    type: Notification['type'];
    content: string;
    link: string;
    novelId?: string;
    commentId?: string;
  }) {
    try {
      const now = new Date().toISOString();
      const notification = {
        id: generateUUID(),
        recipient_id: recipientId,
        sender_id: senderId,
        type,
        content,
        link,
        read: false,
        created_at: now,
        updated_at: now,
        novel_id: novelId,
        comment_id: commentId
      };

      const { error } = await supabase
        .from('notifications')
        .insert(notification);

      if (error) throw error;

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  async getNotifications(userId: string, limit = 50) {
    try {
      const { data, error } = await supabase
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
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Return all notifications immediately - no filtering based on publish_at
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  async getUnreadCount(userId: string) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('read', false);

      if (error) throw error;

      return count || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  },

  async markAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          read: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  async markAllAsRead(userId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          read: true,
          updated_at: new Date().toISOString()
        })
        .eq('recipient_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  async deleteNotification(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  async sendChapterReleaseNotifications({
    novelId,
    chapterNumber,
    chapterTitle,
    novelTitle,
    authorId,
    partNumber,
    novelSlug,
    publishAt,
    coins = 0
  }: {
    novelId: string;
    chapterNumber: number;
    chapterTitle: string;
    novelTitle: string;
    authorId: string;
    partNumber?: number | null;
    novelSlug: string;
    publishAt?: Date | null;
    coins?: number;
  }) {
    try {
      const nowUTC = new Date().toISOString();
      
      console.log('Starting chapter release notification process:', {
        novelId,
        chapterNumber,
        chapterTitle,
        novelTitle,
        authorId,
        partNumber,
        novelSlug,
        timestamp: nowUTC,
        publishAt,
        coins
      });

      // Get all users who have bookmarked this novel
      const { data: bookmarks, error: bookmarksError } = await supabase
        .from('bookmarks')
        .select('id, profile_id, created_at')
        .eq('novel_id', novelId);

      if (bookmarksError) {
        console.error('Error fetching bookmarks:', bookmarksError);
        throw bookmarksError;
      }

      console.log('Found bookmarks:', {
        count: bookmarks?.length || 0,
        bookmarkDetails: bookmarks?.map(b => ({
          bookmarkId: b.id,
          profileId: b.profile_id,
          createdAt: b.created_at
        }))
      });

      if (!bookmarks || bookmarks.length === 0) {
        console.log('No bookmarks found for novel:', {
          novelId,
          authorId,
          timestamp: nowUTC
        });
        return [];
      }

      // Create notifications for each user who has bookmarked the novel
      const notifications = bookmarks.map(bookmark => {
        const isAdvanced = coins > 0 || (publishAt && new Date(publishAt) > new Date(nowUTC));
        const notificationContent = isAdvanced
          ? `[Advanced] Chapter ${chapterNumber}${partNumber ? ` Part ${partNumber}` : ''}: ${chapterTitle} is now available for early access in "${novelTitle}"`
          : `Chapter ${chapterNumber}${partNumber ? ` Part ${partNumber}` : ''}: ${chapterTitle} has been released for "${novelTitle}"`;

        const notification = {
          id: generateUUID(),
          recipient_id: bookmark.profile_id,
          sender_id: authorId,
          type: 'chapter_release' as const,
          content: notificationContent,
          link: `/novels/${novelSlug}/c${chapterNumber}${partNumber ? `-p${partNumber}` : ''}`,
          read: false,
          created_at: nowUTC,
          updated_at: nowUTC,
          novel_id: novelId
        };
        console.log('Creating notification:', {
          notificationId: notification.id,
          recipientId: notification.recipient_id,
          senderId: notification.sender_id,
          bookmarkId: bookmark.id,
          timestamp: nowUTC
        });
        return notification;
      });

      console.log('Prepared notifications:', {
        count: notifications.length,
        recipientIds: notifications.map(n => n.recipient_id),
        timestamp: nowUTC
      });

      if (notifications.length > 0) {
        console.log('Inserting notifications into database...');
        const { error: insertError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (insertError) {
          console.error('Error inserting notifications:', {
            error: insertError,
            recipientIds: notifications.map(n => n.recipient_id),
            timestamp: nowUTC
          });
          throw insertError;
        }

        console.log('Successfully inserted notifications:', {
          count: notifications.length,
          recipientIds: notifications.map(n => n.recipient_id),
          timestamp: nowUTC
        });
      }

      return notifications;
    } catch (error) {
      console.error('Error in sendChapterReleaseNotifications:', {
        error,
        novelId,
        authorId,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }
};