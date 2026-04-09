export interface UserProfile {
  id: string;
  nickname: string;
  gender: string;
  age: number;
  height: number;
  weight: number;
  activity: string;
  climate: string;
  goal: string;
  wakeUp?: string;
  bedTime?: string;
  password?: string;
  is_premium?: boolean;
  premium_until?: string | null;
}

export interface Friend {
  id: string;
  nickname: string;
  dept: string;
  wp: number;
  streak: number;
  isMe: boolean;
}

export interface SearchResult {
  id: string;
  nickname: string;
}

export interface LocalWaterEntry {
  id: string;
  amount: number;
  actual_ml?: number;
  name?: string;
  timestamp: number;
  note?: string;
}

export interface SocialFeedPost {
  id: string;
  author_id: string;
  author: {
    id: string;
    nickname: string;
  };
  content: string;
  image_url: string | null;
  post_kind: 'status' | 'progress' | 'story';
  visibility: 'public' | 'followers';
  like_count: number | null;
  comment_count: number | null;
  likedByMe: boolean;
  created_at: string;
  hydration_ml: number | null;
  streak_snapshot: number | null;
  expires_at: string | null;
}

export interface SocialProfileStats {
  followers: number;
  following: number;
  posts: number;
}

export interface SocialComposerState {
  content: string;
  imageUrl: string;
  postKind: 'status' | 'progress' | 'story';
  visibility: 'public' | 'followers';
}

export interface SocialDiscoverProfile {
  id: string;
  nickname: string;
  isFollowing: boolean;
}
