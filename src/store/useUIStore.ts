import { create } from 'zustand';

interface UIState {
  view: 'welcome' | 'login' | 'register' | 'app';
  setView: (view: 'welcome' | 'login' | 'register' | 'app') => void;
  activeTab: 'home' | 'insight' | 'league' | 'feed' | 'profile';
  setActiveTab: (activeTab: 'home' | 'insight' | 'league' | 'feed' | 'profile') => void;
  showPremiumModal: boolean;
  setShowPremiumModal: (show: boolean) => void;
  showAiChat: boolean;
  setShowAiChat: (show: boolean) => void;
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
  showAddFriend: boolean;
  setShowAddFriend: (show: boolean) => void;
  showEditProfile: boolean;
  setShowEditProfile: (show: boolean) => void;
  showProfileSettings: boolean;
  setShowProfileSettings: (show: boolean) => void;
  isPremium: boolean;
  setIsPremium: (premium: boolean) => void;
  leagueMode: 'public' | 'friends';
  setLeagueMode: (mode: 'public' | 'friends') => void;
  isFastingMode: boolean;
  setIsFastingMode: (fasting: boolean) => void;
  fastingStartTime: number | null;
  setFastingStartTime: (time: number | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  view: 'welcome',
  setView: (view) => set({ view }),
  activeTab: 'home',
  setActiveTab: (activeTab) => set({ activeTab }),
  showPremiumModal: false,
  setShowPremiumModal: (showPremiumModal) => set({ showPremiumModal }),
  showAiChat: false,
  setShowAiChat: (showAiChat) => set({ showAiChat }),
  showOnboarding: false,
  setShowOnboarding: (showOnboarding) => set({ showOnboarding }),
  showAddFriend: false,
  setShowAddFriend: (showAddFriend) => set({ showAddFriend }),
  showEditProfile: false,
  setShowEditProfile: (showEditProfile) => set({ showEditProfile }),
  showProfileSettings: false,
  setShowProfileSettings: (showProfileSettings) => set({ showProfileSettings }),
  isPremium: false,
  setIsPremium: (isPremium) => set({ isPremium }),
  leagueMode: 'public',
  setLeagueMode: (leagueMode) => set({ leagueMode }),
  isFastingMode: false,
  setIsFastingMode: (isFastingMode) => set({ isFastingMode }),
  fastingStartTime: null,
  setFastingStartTime: (fastingStartTime) => set({ fastingStartTime }),
}));
