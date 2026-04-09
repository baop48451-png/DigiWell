import { create } from 'zustand';
import { Friend, SearchResult, SocialFeedPost, SocialProfileStats, SocialComposerState, SocialDiscoverProfile } from '../types';
import { DEFAULT_SOCIAL_COMPOSER, DEFAULT_SOCIAL_PROFILE_STATS } from '../lib/social';

interface SocialState {
  friendsList: Friend[];
  setFriendsList: (friendsList: Friend[]) => void;
  searchResults: SearchResult[];
  setSearchResults: (searchResults: SearchResult[]) => void;
  socialPosts: SocialFeedPost[];
  setSocialPosts: (socialPosts: SocialFeedPost[]) => void;
  socialStories: SocialFeedPost[];
  setSocialStories: (socialStories: SocialFeedPost[]) => void;
  socialFollowingIds: string[];
  setSocialFollowingIds: (ids: string[]) => void;
  socialProfileStats: SocialProfileStats;
  setSocialProfileStats: (stats: SocialProfileStats) => void;
  socialComposer: SocialComposerState;
  setSocialComposer: (composer: SocialComposerState) => void;
  socialSearchResults: SocialDiscoverProfile[];
  setSocialSearchResults: (results: SocialDiscoverProfile[]) => void;
  socialImageFile: File | null;
  setSocialImageFile: (file: File | null) => void;
  socialImagePreview: string;
  setSocialImagePreview: (preview: string) => void;
  showSocialComposer: boolean;
  setShowSocialComposer: (show: boolean) => void;
  showDiscoverPeople: boolean;
  setShowDiscoverPeople: (show: boolean) => void;
  showSocialProfile: boolean;
  setShowSocialProfile: (show: boolean) => void;
  socialError: string;
  setSocialError: (error: string) => void;
  receivedNudges: Array<{ from: string; nickname: string; timestamp: number }>;
  setReceivedNudges: (nudges: any[]) => void;
}

export const useSocialStore = create<SocialState>((set) => ({
  friendsList: [],
  setFriendsList: (friendsList) => set({ friendsList }),
  searchResults: [],
  setSearchResults: (searchResults) => set({ searchResults }),
  socialPosts: [],
  setSocialPosts: (socialPosts) => set({ socialPosts }),
  socialStories: [],
  setSocialStories: (socialStories) => set({ socialStories }),
  socialFollowingIds: [],
  setSocialFollowingIds: (socialFollowingIds) => set({ socialFollowingIds }),
  socialProfileStats: DEFAULT_SOCIAL_PROFILE_STATS,
  setSocialProfileStats: (socialProfileStats) => set({ socialProfileStats }),
  socialComposer: { ...DEFAULT_SOCIAL_COMPOSER },
  setSocialComposer: (socialComposer) => set({ socialComposer }),
  socialSearchResults: [],
  setSocialSearchResults: (socialSearchResults) => set({ socialSearchResults }),
  socialImageFile: null,
  setSocialImageFile: (socialImageFile) => set({ socialImageFile }),
  socialImagePreview: '',
  setSocialImagePreview: (socialImagePreview) => set({ socialImagePreview }),
  showSocialComposer: false,
  setShowSocialComposer: (showSocialComposer) => set({ showSocialComposer }),
  showDiscoverPeople: false,
  setShowDiscoverPeople: (showDiscoverPeople) => set({ showDiscoverPeople }),
  showSocialProfile: false,
  setShowSocialProfile: (showSocialProfile) => set({ showSocialProfile }),
  socialError: '',
  setSocialError: (socialError) => set({ socialError }),
  receivedNudges: [],
  setReceivedNudges: (receivedNudges) => set({ receivedNudges }),
}));
