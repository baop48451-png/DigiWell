import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useHydrationStore } from '../store/useHydrationStore';
import { toast } from 'sonner';

export type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: number;
};

export type Challenge = {
  id: string;
  name: string;
  goal: number;
  current: number;
  type: 'streak' | 'total' | 'daily';
  isCompleted: boolean;
};

export function useGamificationLogic() {
  const { profile } = useAuthStore();
  const { waterIntake, waterEntries } = useHydrationStore();

  const checkChallenges = useCallback(async () => {
    if (!profile?.id) return;

    // Example Challenge: 3-Day Streak
    // In a real app, this would query a 'challenges' table and 'user_challenges'
    
    const todayStr = new Date().toISOString().split('T')[0];
    const { data: logs, error } = await supabase
      .from('water_logs')
      .select('day, intake_ml')
      .eq('user_id', profile.id)
      .order('day', { ascending: false })
      .limit(3);

    if (error || !logs) return;

    const isStreakActive = logs.length >= 3 && logs.every(l => l.intake_ml >= 2000);
    
    if (isStreakActive) {
      await awardBadge('streak_3_days');
    }
  }, [profile?.id]);

  const awardBadge = async (badgeId: string) => {
    if (!profile?.id) return;
    
    try {
      const { error } = await supabase
        .from('user_badges')
        .insert({ user_id: profile.id, badge_id: badgeId, unlocked_at: new Date().toISOString() });
      
      if (error && error.code !== '23505') throw error;
      
      // If it's a new badge (not error 23505), show toast
      if (error?.code !== '23505') {
        toast.success(`Chúc mừng! Bạn đã mở khóa huy hiệu mới! 🏆`);
      }
    } catch (err) {
      console.error('Badge error:', err);
    }
  };

  return {
    checkChallenges,
    awardBadge
  };
}
