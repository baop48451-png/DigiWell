export type SocialComposerState = {
  content: string;
  imageUrl: string;
  postKind: 'status' | 'progress' | 'story';
  visibility: 'public' | 'followers';
};

export type SocialProfileSummary = {
  id: string;
  nickname: string;
};

export type SocialDiscoverProfile = SocialProfileSummary & {
  isFollowing: boolean;
};

export type SocialProfileStats = {
  followers: number;
  following: number;
  posts: number;
};

export type SocialPostRow = {
  id: string;
  author_id: string;
  content: string;
  image_url: string | null;
  post_kind: 'status' | 'progress' | 'story';
  visibility: 'public' | 'followers';
  hydration_ml: number | null;
  streak_snapshot: number | null;
  like_count: number | null;
  created_at: string;
  expires_at: string | null;
};

export type SocialFeedPost = SocialPostRow & {
  author: SocialProfileSummary;
  likedByMe: boolean;
};

export const DEFAULT_SOCIAL_COMPOSER: SocialComposerState = {
  content: '',
  imageUrl: '',
  postKind: 'status',
  visibility: 'public',
};

export const DEFAULT_SOCIAL_PROFILE_STATS: SocialProfileStats = {
  followers: 0,
  following: 0,
  posts: 0,
};

export const getRelativeTimeLabel = (value: string) => {
  const createdAt = new Date(value);
  const diffMs = Date.now() - createdAt.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) return `${diffMinutes} phút`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} ngày`;

  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(createdAt);
};

export const buildProgressShareText = (params: {
  nickname?: string;
  waterIntake: number;
  waterGoal: number;
  streak: number;
}) => {
  const progressPercent = Math.min(100, Math.round((params.waterIntake / Math.max(params.waterGoal, 1)) * 100));
  const name = params.nickname || 'Mình';

  return `${name} vừa chạm ${progressPercent}% mục tiêu nước hôm nay: ${params.waterIntake}/${params.waterGoal}ml. Streak hiện tại ${params.streak} ngày, ai theo challenge uống nước cùng không?`;
};

export const isMissingSocialSchemaError = (message: string) => {
  const lowered = message.toLowerCase();
  return lowered.includes('social_posts')
    || lowered.includes('social_follows')
    || lowered.includes('social_post_likes')
    || lowered.includes('social-media')
    || lowered.includes('bucket')
    || lowered.includes('relation')
    || lowered.includes('does not exist');
};
