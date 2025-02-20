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
          )
        `)
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data;
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
    authorId
  }: {
    novelId: string;
    chapterNumber: number;
    chapterTitle: string;
    novelTitle: string;
    authorId: string;
  }) {
    try {
      console.log('Sending chapter release notifications for:', {
        novelId,
        chapterNumber,
        chapterTitle,
        novelTitle,
        authorId
      });

      // Get all users who have bookmarked this novel
      const { data: bookmarks, error: bookmarksError } = await supabase
        .from('bookmarks')
        .select('profile_id')
        .eq('novel_id', novelId);

      if (bookmarksError) throw bookmarksError;

      console.log('Found bookmarks:', bookmarks);

      // Create notifications for each user who has bookmarked the novel
      const notifications = bookmarks.map(bookmark => ({
        id: generateUUID(),
        recipient_id: bookmark.profile_id,
        sender_id: authorId,
        type: 'chapter_release' as const,
        content: `Chapter ${chapterNumber}: ${chapterTitle} has been released for "${novelTitle}"`,
        link: `/novel/${novelId}/chapter/${chapterNumber}`,
        read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        novel_id: novelId
      }));

      console.log('Created notification objects:', notifications);

      if (notifications.length > 0) {
        const { error: insertError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (insertError) {
          console.error('Error inserting notifications:', insertError);
          throw insertError;
        }

        console.log('Successfully inserted notifications');
      } else {
        console.log('No notifications to send - no bookmarks found');
      }

      return notifications;
    } catch (error) {
      console.error('Error sending chapter release notifications:', error);
      throw error;
    }
  }
}; 