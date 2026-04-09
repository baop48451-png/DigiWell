import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useSocialStore } from '../store/useSocialStore';
import { toast } from 'sonner';
import { isMissingSocialSchemaError } from '../lib/social';

export function useSocialLogic() {
  const { profile } = useAuthStore();
  const { 
    setFriendsList, 
    setSearchResults, 
    setSocialPosts, 
    setSocialStories, 
    setSocialFollowingIds, 
    setSocialProfileStats, 
    setSocialSearchResults, 
    setSocialError,
    setReceivedNudges
  } = useSocialStore();

  const refreshSocialFeed = useCallback(async (options?: { silent?: boolean }) => {
    if (!profile?.id) return;

    try {
      const [
        followingRes,
        followersCountRes,
        followingCountRes,
        postsCountRes,
      ] = await Promise.all([
        supabase.from('social_follows').select('following_id').eq('follower_id', profile.id),
        supabase.from('social_follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id),
        supabase.from('social_follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id),
        supabase.from('social_posts').select('*', { count: 'exact', head: true }).eq('author_id', profile.id),
      ]);

      if (followingRes.error) throw followingRes.error;
      if (followersCountRes.error) throw followersCountRes.error;
      if (followingCountRes.error) throw followingCountRes.error;
      if (postsCountRes.error) throw postsCountRes.error;

      const followingIds = (followingRes.data || []).map((row: any) => row.following_id);
      setSocialFollowingIds(followingIds);
      setSocialProfileStats({
        followers: followersCountRes.count || 0,
        following: followingCountRes.count || 0,
        posts: postsCountRes.count || 0,
      });

      const feedAuthorIds = Array.from(new Set([profile.id, ...followingIds]));
      const { data: postRows, error: postsError } = await supabase
        .from('social_posts')
        .select('id, author_id, content, image_url, post_kind, visibility, hydration_ml, streak_snapshot, like_count, created_at, expires_at')
        .in('author_id', feedAuthorIds)
        .order('created_at', { ascending: false })
        .limit(40);

      if (postsError) throw postsError;

      const validRows = (postRows || []).filter((row: any) => {
        if (row.post_kind !== 'story') return true;
        if (!row.expires_at) return false;
        return new Date(row.expires_at).getTime() > Date.now();
      });

      const authorIds = Array.from(new Set(validRows.map((row: any) => row.author_id)));
      const postIds = validRows.map((row: any) => row.id);

      const [profilesRes, likesRes] = await Promise.all([
        authorIds.length > 0
          ? supabase.from('profiles').select('id, nickname').in('id', authorIds)
          : Promise.resolve({ data: [], error: null }),
        postIds.length > 0
          ? supabase.from('social_post_likes').select('post_id').eq('user_id', profile.id).in('post_id', postIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (likesRes.error) throw likesRes.error;

      const profileMap = new Map((profilesRes.data || []).map((row: any) => [row.id, {
        id: row.id,
        nickname: row.nickname || 'Người dùng DigiWell',
      }]));
      const likedPostIds = new Set((likesRes.data || []).map((row: any) => row.post_id));

      const mappedPosts = validRows.map((row: any) => ({
        ...row,
        author: profileMap.get(row.author_id) || {
          id: row.author_id,
          nickname: row.author_id === profile.id ? (profile.nickname || 'Bạn') : 'Người dùng DigiWell',
        },
        likedByMe: likedPostIds.has(row.id),
      }));

      const storyMap = new Map<string, any>();
      const latestStories = mappedPosts
        .filter((post: any) => post.post_kind === 'story')
        .reduce<any[]>((acc, post) => {
          if (storyMap.has(post.author_id)) return acc;
          storyMap.set(post.author_id, post);
          acc.push(post);
          return acc;
        }, []);

      setSocialStories(latestStories);
      setSocialPosts(mappedPosts.filter((post: any) => post.post_kind !== 'story'));
      setSocialError('');
    } catch (err: any) {
      const friendlyMessage = isMissingSocialSchemaError(err.message) 
        ? 'Social chưa được bật trên Supabase. Hãy chạy file supabase/social_lite.sql rồi mở lại app.'
        : err.message || 'Không thể tải tính năng cộng đồng lúc này.';
      setSocialError(friendlyMessage);
      toast.error(friendlyMessage);
    }
  }, [profile?.id, setSocialFollowingIds, setSocialProfileStats, setSocialStories, setSocialPosts, setSocialError]);

  const handleSearchUser = async (query: string) => {
    if (!profile?.id) return;
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nickname')
        .ilike('nickname', `%${query}%`)
        .neq('id', profile.id)
        .limit(5);
      if (error) throw error;
      setSearchResults(data || []);
    } catch (err: any) {
      toast.error('Lỗi tìm kiếm người dùng.');
    }
  };

  const handleAddFriend = async (friendId: string, friendName: string) => {
    if (!profile?.id) return;
    const toastId = toast.loading("Đang gửi lời mời...");
    try {
      const { error } = await supabase
        .from('friends')
        .insert({ user_id: profile.id, friend_id: friendId });
      if (error) {
        if (error.code === '23505') throw new Error(`Bạn và ${friendName} đã là bạn bè!`);
        throw error;
      }
      toast.success(`Đã thêm ${friendName} vào danh sách theo dõi!`, { id: toastId });
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    }
  };

  const sendNudge = async (friendId: string, friendNickname: string) => {
    if (!profile?.id) return;
    try {
      const { error } = await supabase
        .from('social_nudges')
        .insert({ 
          sender_id: profile.id, 
          receiver_id: friendId, 
          message: 'Uống nước đi bạn ơi! 💧' 
        });
      if (error) throw error;
      toast.success(`Đã gửi lời nhắc đến ${friendNickname}!`);
    } catch (err: any) {
      toast.error('Không thể gửi lời nhắc lúc này.');
    }
  };

  const fetchNudges = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const { data, error } = await supabase
        .from('social_nudges')
        .select('sender_id, created_at')
        .eq('receiver_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;

      const nudges = await Promise.all((data || []).map(async (n: any) => {
        const { data: p } = await supabase.from('profiles').select('nickname').eq('id', n.sender_id).single();
        return {
          from: n.sender_id,
          nickname: p?.nickname || 'Bạn bè',
          timestamp: new Date(n.created_at).getTime()
        };
      }));
      setReceivedNudges(nudges);
    } catch (err) {
      console.error('Error fetching nudges:', err);
    }
  }, [profile?.id, setReceivedNudges]);

  const loadSocialDirectory = useCallback(async (query: string) => {
    if (!profile?.id) return;
    try {
      const keyword = query.trim();
      let request = supabase
        .from('profiles')
        .select('id, nickname')
        .neq('id', profile.id);

      request = keyword.length >= 2
        ? request.ilike('nickname', `%${keyword}%`)
        : request.order('nickname', { ascending: true });

      const { data, error } = await request.limit(8);
      if (error) throw error;

      setSocialSearchResults((data || []).map((user: any) => ({
        id: user.id,
        nickname: user.nickname || 'Người dùng DigiWell',
        isFollowing: false,
      })));
    } catch (err: any) {
      setSocialError(err.message);
    }
  }, [profile?.id, setSocialSearchResults, setSocialError]);

  return {
    refreshSocialFeed,
    handleSearchUser,
    handleAddFriend,
    loadSocialDirectory,
    sendNudge,
    fetchNudges
  };
}
