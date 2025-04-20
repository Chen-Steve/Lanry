import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import toast from 'react-hot-toast';
import supabase from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

interface ProfileData {
  id: string;
  username: string;
  avatar_url: string | null;
  role: 'USER' | 'AUTHOR' | 'TRANSLATOR';
}

interface ReplyData {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profile_id: string;
  parent_comment_id: string;
  profile: ProfileData;
}

interface CommentReply {
  id: string;
  content: string;
  createdAt: string;
  profileId: string;
  parentId: string;
  profile: {
    id: string;
    username: string;
    avatar_url?: string;
    role: 'USER' | 'AUTHOR' | 'TRANSLATOR';
  };
  likeCount?: number;
  isLiked?: boolean;
}

interface CommentRepliesProps {
  parentCommentId: string;
  chapterId: string;
  isExpanded: boolean;
  userId: string | null;
  authorId: string;
  onReplyAdded?: () => void;
}

export function CommentReplies({
  parentCommentId,
  chapterId,
  isExpanded,
  userId,
  authorId,
  onReplyAdded
}: CommentRepliesProps) {
  const [replies, setReplies] = useState<CommentReply[]>([]);
  const [newReply, setNewReply] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const fetchReplies = useCallback(async () => {
    if (!isExpanded) return;
    
    try {
      const { data, error } = await supabase
        .from('chapter_thread_comments')
        .select(`
          id,
          content,
          created_at,
          updated_at,
          profile_id,
          parent_comment_id,
          profile:profiles (
            id,
            username,
            avatar_url,
            role
          )
        `)
        .eq('parent_comment_id', parentCommentId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Transform the data
      const typedData = data as unknown as ReplyData[];
      const transformedReplies = typedData.map(reply => ({
        id: reply.id,
        content: reply.content,
        createdAt: reply.created_at,
        profileId: reply.profile_id,
        parentId: reply.parent_comment_id,
        profile: {
          id: reply.profile.id,
          username: reply.profile.username,
          avatar_url: reply.profile.avatar_url ?? undefined,
          role: reply.profile.role
        }
      }));

      setReplies(transformedReplies);
    } catch (err) {
      console.error('Error fetching replies:', err);
      toast.error('Failed to load replies');
    } finally {
      setIsLoading(false);
    }
  }, [isExpanded, parentCommentId]);

  // Fetch replies when expanded
  useEffect(() => {
    if (isExpanded) {
      setIsLoading(true);
      fetchReplies();
    }
  }, [isExpanded, fetchReplies]);

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      toast.error('Please sign in to reply');
      return;
    }

    if (!newReply.trim()) {
      toast.error('Reply cannot be empty');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('chapter_thread_comments')
        .insert({
          id: uuidv4(),
          chapter_id: chapterId,
          content: newReply.trim(),
          profile_id: userId,
          parent_comment_id: parentCommentId,
          created_at: now,
          updated_at: now
        })
        .select(`
          id,
          content,
          created_at,
          profile_id,
          parent_comment_id,
          profile:profiles (
            id,
            username,
            avatar_url,
            role
          )
        `)
        .single();

      if (error) throw error;
      
      const replyData = data as unknown as ReplyData;
      const newReplyData: CommentReply = {
        id: replyData.id,
        content: replyData.content,
        createdAt: replyData.created_at,
        profileId: replyData.profile_id,
        parentId: replyData.parent_comment_id,
        profile: {
          id: replyData.profile.id,
          username: replyData.profile.username,
          avatar_url: replyData.profile.avatar_url ?? undefined,
          role: replyData.profile.role
        }
      };

      setReplies(prev => [...prev, newReplyData]);
      setNewReply('');
      if (onReplyAdded) onReplyAdded();
      toast.success('Reply posted successfully');
    } catch (err) {
      console.error('Error posting reply:', err);
      toast.error('Failed to post reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (replyId: string, content: string) => {
    try {
      const { error } = await supabase
        .from('chapter_thread_comments')
        .update({
          content: content.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', replyId)
        .eq('profile_id', userId);

      if (error) throw error;
      
      setReplies(prev => prev.map(reply => 
        reply.id === replyId 
          ? { ...reply, content: content.trim() }
          : reply
      ));
      setEditingReplyId(null);
      setEditContent('');
      toast.success('Reply updated successfully');
    } catch (err) {
      console.error('Error updating reply:', err);
      toast.error('Failed to update reply');
    }
  };

  const handleDelete = async (replyId: string) => {
    try {
      const { error } = await supabase
        .from('chapter_thread_comments')
        .delete()
        .eq('id', replyId)
        .eq('profile_id', userId);

      if (error) throw error;
      
      setReplies(prev => prev.filter(reply => reply.id !== replyId));
      if (onReplyAdded) onReplyAdded();
      toast.success('Reply deleted successfully');
    } catch (err) {
      console.error('Error deleting reply:', err);
      toast.error('Failed to delete reply');
    }
  };

  const startEditing = (replyId: string) => {
    const reply = replies.find(r => r.id === replyId);
    if (reply) {
      setEditingReplyId(replyId);
      setEditContent(reply.content);
    }
  };

  const renderAvatar = (username: string, avatarUrl?: string) => {
    if (avatarUrl) {
      return (
        <Image
          src={avatarUrl}
          alt={username}
          width={32}
          height={32}
          className="w-8 h-8 rounded-full object-cover"
          unoptimized
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = username[0]?.toUpperCase() || '?';
              parent.className = "w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium";
            }
          }}
        />
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
        {username[0]?.toUpperCase() || '?'}
      </div>
    );
  };

  if (!isExpanded) return null;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-4">
        <Icon icon="eos-icons:loading" className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="pl-12 space-y-4 mt-2">
      {/* Reply Form */}
      <form onSubmit={handleSubmitReply} className="space-y-2">
        <Textarea
          value={newReply}
          onChange={(e) => setNewReply(e.target.value)}
          placeholder={userId ? "Write a reply..." : "Please sign in to reply"}
          disabled={!userId || isSubmitting}
          className="w-full min-h-[80px] dark:text-black"
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!userId || isSubmitting || !newReply.trim()}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Icon icon="eos-icons:loading" className="w-4 h-4 animate-spin" />
                <span>Posting...</span>
              </>
            ) : (
              <>
                <Icon icon="mdi:reply" className="w-4 h-4" />
                <span>Post Reply</span>
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Replies List */}
      <div className="space-y-4">
        {replies.length === 0 ? (
          <p className="text-muted-foreground text-sm">No replies yet. Be the first to reply!</p>
        ) : (
          replies.map(reply => (
            <div key={reply.id} className="flex gap-3">
              <div className="flex-shrink-0">
                {renderAvatar(reply.profile.username, reply.profile.avatar_url)}
              </div>
              <div className="flex-grow space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{reply.profile.username}</span>
                    {reply.profile.role && reply.profile.role !== 'USER' && (
                      <span className={`px-1 py-0.5 text-xs font-medium rounded inline-flex items-center flex-shrink-0 ${
                        reply.profile.role === 'AUTHOR' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                        reply.profile.role === 'TRANSLATOR' ? 'bg-blue-100 dark:bg-blue-900/30' :
                        'bg-gray-100 dark:bg-gray-800'
                      } text-black dark:text-gray-200`}>
                        {reply.profile.role.charAt(0) + reply.profile.role.slice(1).toLowerCase()}
                      </span>
                    )}
                  </div>
                  <time dateTime={reply.createdAt} className="text-sm text-muted-foreground">
                    {new Date(reply.createdAt).toLocaleDateString()}
                  </time>
                </div>
                {editingReplyId === reply.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full min-h-[80px] dark:text-black"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          handleEdit(reply.id, editContent);
                        }}
                        disabled={!editContent.trim() || editContent.trim() === reply.content}
                        className="text-sm"
                      >
                        Save
                      </Button>
                      <Button
                        onClick={() => {
                          setEditingReplyId(null);
                          setEditContent('');
                        }}
                        variant="outline"
                        className="text-sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{reply.content}</p>
                    <div className="flex justify-end gap-2">
                      {userId === reply.profile.id && (
                        <>
                          <button
                            onClick={() => startEditing(reply.id)}
                            className="text-blue-500 hover:text-blue-600 transition-colors p-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            title="Edit reply"
                          >
                            <Icon icon="lucide:edit-2" className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(reply.id)}
                            className="text-red-500 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Delete reply"
                          >
                            <Icon icon="lucide:trash-2" className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {userId === authorId && userId !== reply.profile.id && (
                        <button
                          onClick={() => handleDelete(reply.id)}
                          className="text-red-500 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Delete reply"
                        >
                          <Icon icon="mdi:delete" className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CommentReplies; 