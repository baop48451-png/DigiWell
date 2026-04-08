/**
 * DigiWell Social Enhanced Module
 * Comments, Direct Messages, Notifications
 */

import { supabase } from './supabase';

// Types
export type SocialComment = {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  like_count: number;
  created_at: string;
  updated_at: string;
  author?: { id: string; nickname: string };
  likedByMe?: boolean;
};

export type DirectMessage = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  sender?: { id: string; nickname: string };
  receiver?: { id: string; nickname: string };
};

export type ConversationPreview = {
  id: string;
  otherUser: { id: string; nickname: string };
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
};

export type Notification = {
  id: string;
  user_id: string;
  type: 'like_post' | 'like_comment' | 'comment' | 'follow' | 'mention' | 'dm';
  actor_id: string | null;
  post_id: string | null;
  comment_id: string | null;
  message_id: string | null;
  content: string | null;
  is_read: boolean;
  created_at: string;
  actor?: { id: string; nickname: string };
};

// ============================================================================
// COMMENTS
// ============================================================================

export async function fetchComments(postId: string, currentUserId: string): Promise<SocialComment[]> {
  if (!supabase) return [];

  try {
    const { data: comments, error } = await supabase
      .from('social_comments')
      .select(`
        *,
        author:profiles(id, nickname)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Get my likes for these comments
    const commentIds = comments?.map(c => c.id) || [];
    const { data: myLikes } = await supabase
      .from('social_comment_likes')
      .select('comment_id')
      .eq('user_id', currentUserId)
      .in('comment_id', commentIds);

    const likedCommentIds = new Set(myLikes?.map(l => l.comment_id) || []);

    return (comments || []).map(comment => ({
      ...comment,
      likedByMe: likedCommentIds.has(comment.id),
      author: comment.author
    }));
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
}

export async function addComment(
  postId: string,
  authorId: string,
  content: string
): Promise<{ success: boolean; comment?: SocialComment; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase not configured' };

  try {
    const { data, error } = await supabase
      .from('social_comments')
      .insert({ post_id: postId, author_id: authorId, content })
      .select(`
        *,
        author:profiles(id, nickname)
      `)
      .single();

    if (error) throw error;

    return { success: true, comment: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteComment(commentId: string, authorId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('social_comments')
      .delete()
      .eq('id', commentId)
      .eq('author_id', authorId);

    if (error) throw error;
    return true;
  } catch {
    return false;
  }
}

export async function toggleCommentLike(
  commentId: string,
  userId: string,
  currentlyLiked: boolean
): Promise<boolean> {
  if (!supabase) return false;

  try {
    if (currentlyLiked) {
      await supabase
        .from('social_comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', userId);

      await supabase.from('social_comments')
        .update({ like_count: Math.max(0, 0) })
        .eq('id', commentId);
    } else {
      await supabase
        .from('social_comment_likes')
        .insert({ comment_id: commentId, user_id: userId });

      const { data } = await supabase
        .from('social_comments')
        .select('like_count')
        .eq('id', commentId)
        .single();
      
      if (data) {
        await supabase.from('social_comments')
          .update({ like_count: data.like_count + 1 })
          .eq('id', commentId);
      }
    }
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// DIRECT MESSAGES
// ============================================================================

export async function fetchConversations(userId: string): Promise<ConversationPreview[]> {
  if (!supabase) return [];

  try {
    // Get all unique conversations
    const { data: messages, error } = await supabase
      .from('direct_messages')
      .select(`
        *,
        sender:profiles!sender_id(id, nickname),
        receiver:profiles!receiver_id(id, nickname)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Group by conversation pairs
    const conversationMap = new Map<string, {
      otherUser: { id: string; nickname: string };
      lastMessage: string;
      lastMessageAt: string;
      unreadCount: number;
    }>();

    for (const msg of messages || []) {
      const otherUserId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      const otherUser = msg.sender_id === userId ? msg.receiver : msg.sender;
      const key = [userId, otherUserId].sort().join('-');

      if (!conversationMap.has(key)) {
        conversationMap.set(key, {
          otherUser: otherUser || { id: otherUserId, nickname: 'Người dùng' },
          lastMessage: msg.content,
          lastMessageAt: msg.created_at,
          unreadCount: msg.receiver_id === userId && !msg.is_read ? 1 : 0
        });
      } else {
        const conv = conversationMap.get(key)!;
        if (msg.receiver_id === userId && !msg.is_read) {
          conv.unreadCount++;
        }
      }
    }

    return Array.from(conversationMap.entries()).map(([id, conv]) => ({
      id,
      ...conv
    }));
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
}

export async function fetchMessages(
  otherUserId: string,
  currentUserId: string
): Promise<DirectMessage[]> {
  if (!supabase) return [];

  try {
    const { data: messages, error } = await supabase
      .from('direct_messages')
      .select(`
        *,
        sender:profiles!sender_id(id, nickname),
        receiver:profiles!receiver_id(id, nickname)
      `)
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Mark messages as read
    await supabase
      .from('direct_messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('receiver_id', currentUserId)
      .eq('sender_id', otherUserId)
      .eq('is_read', false);

    return messages || [];
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
}

export async function sendMessage(
  senderId: string,
  receiverId: string,
  content: string
): Promise<{ success: boolean; message?: DirectMessage; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase not configured' };

  try {
    const { data, error } = await supabase
      .from('direct_messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        content
      })
      .select(`
        *,
        sender:profiles!sender_id(id, nickname),
        receiver:profiles!receiver_id(id, nickname)
      `)
      .single();

    if (error) throw error;

    return { success: true, message: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export async function fetchNotifications(userId: string): Promise<Notification[]> {
  if (!supabase) return [];

  try {
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select(`
        *,
        actor:profiles!actor_id(id, nickname)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return notifications || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

export async function fetchUnreadNotificationCount(userId: string): Promise<number> {
  if (!supabase) return 0;

  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  } catch {
    return 0;
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
    return true;
  } catch {
    return false;
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// REALTIME SUBSCRIPTIONS
// ============================================================================

export function subscribeToComments(
  postId: string,
  onNewComment: (comment: SocialComment) => void
): () => void {
  if (!supabase) return () => {};
  const client = supabase;

  const channel = client
    .channel(`comments:${postId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'social_comments',
        filter: `post_id=eq.${postId}`
      },
      (payload) => {
        onNewComment(payload.new as SocialComment);
      }
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}

export function subscribeToNotifications(
  userId: string,
  onNewNotification: (notification: Notification) => void
): () => void {
  if (!supabase) return () => {};
  const client = supabase;

  const channel = client
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        onNewNotification(payload.new as Notification);
      }
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}

export function subscribeToMessages(
  currentUserId: string,
  onNewMessage: (message: DirectMessage) => void
): () => void {
  if (!supabase) return () => {};
  const client = supabase;

  const channel = client
    .channel(`messages:${currentUserId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
        filter: `receiver_id=eq.${currentUserId}`
      },
      (payload) => {
        onNewMessage(payload.new as DirectMessage);
      }
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}
