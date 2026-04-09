import { create } from 'zustand';
import { UserProfile } from '../types';

interface AuthState {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile | null) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  isUpdatingProfile: boolean;
  setIsUpdatingProfile: (updating: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  updateProfile: (updates) => set((state) => ({
    profile: state.profile ? { ...state.profile, ...updates } : null,
  })),
  isUpdatingProfile: false,
  setIsUpdatingProfile: (updating) => set({ isUpdatingProfile: updating }),
}));
