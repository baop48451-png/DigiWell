/**
 * DigiWell Achievement System
 * Hệ thống huy hiệu và thành tích
 */

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  requirement: number;
  type: 'streak' | 'total' | 'daily' | 'social';
  unlockedAt?: number;
  isUnlocked: boolean;
};

// Danh sách tất cả achievements
export const ACHIEVEMENTS: Achievement[] = [
  // Streak Achievements
  {
    id: 'streak_3',
    name: 'Khởi đầu',
    description: '3 ngày liên tiếp hoàn thành mục tiêu',
    icon: '🔥',
    color: '#f97316',
    bgColor: 'rgba(249,115,22,0.15)',
    borderColor: 'rgba(249,115,22,0.3)',
    requirement: 3,
    type: 'streak',
    isUnlocked: false,
  },
  {
    id: 'streak_7',
    name: 'Kỷ luật thép',
    description: '7 ngày liên tiếp hoàn thành mục tiêu',
    icon: '⚡',
    color: '#eab308',
    bgColor: 'rgba(234,179,8,0.15)',
    borderColor: 'rgba(234,179,8,0.3)',
    requirement: 7,
    type: 'streak',
    isUnlocked: false,
  },
  {
    id: 'streak_30',
    name: 'Siêu nhân Hydration',
    description: '30 ngày liên tiếp hoàn thành mục tiêu',
    icon: '🦸',
    color: '#a855f7',
    bgColor: 'rgba(168,85,247,0.15)',
    borderColor: 'rgba(168,85,247,0.3)',
    requirement: 30,
    type: 'streak',
    isUnlocked: false,
  },
  {
    id: 'streak_100',
    name: 'Huyền thoại',
    description: '100 ngày liên tiếp hoàn thành mục tiêu',
    icon: '👑',
    color: '#fbbf24',
    bgColor: 'rgba(251,191,36,0.15)',
    borderColor: 'rgba(251,191,36,0.3)',
    requirement: 100,
    type: 'streak',
    isUnlocked: false,
  },

  // Daily Achievements
  {
    id: 'daily_100',
    name: 'Bước đầu tiên',
    description: 'Hoàn thành 100% mục tiêu trong 1 ngày',
    icon: '🎯',
    color: '#22c55e',
    bgColor: 'rgba(34,197,94,0.15)',
    borderColor: 'rgba(34,197,94,0.3)',
    requirement: 1,
    type: 'daily',
    isUnlocked: false,
  },
  {
    id: 'daily_7_100',
    name: 'Tuần hoàn hảo',
    description: '7 ngày liên tiếp đạt 100%',
    icon: '⭐',
    color: '#facc15',
    bgColor: 'rgba(250,204,21,0.15)',
    borderColor: 'rgba(250,204,21,0.3)',
    requirement: 7,
    type: 'daily',
    isUnlocked: false,
  },
  {
    id: 'daily_30_100',
    name: 'Tháng vàng',
    description: '30 ngày liên tiếp đạt 100%',
    icon: '🏆',
    color: '#f59e0b',
    bgColor: 'rgba(245,158,11,0.15)',
    borderColor: 'rgba(245,158,11,0.3)',
    requirement: 30,
    type: 'daily',
    isUnlocked: false,
  },

  // Total Achievements
  {
    id: 'total_10L',
    name: 'Người uống nước',
    description: 'Tổng lượng nước đạt 10 Lít',
    icon: '💧',
    color: '#06b6d4',
    bgColor: 'rgba(6,182,212,0.15)',
    borderColor: 'rgba(6,182,212,0.3)',
    requirement: 10000,
    type: 'total',
    isUnlocked: false,
  },
  {
    id: 'total_50L',
    name: 'Đại sứ Hydration',
    description: 'Tổng lượng nước đạt 50 Lít',
    icon: '🌊',
    color: '#0ea5e9',
    bgColor: 'rgba(14,165,233,0.15)',
    borderColor: 'rgba(14,165,233,0.3)',
    requirement: 50000,
    type: 'total',
    isUnlocked: false,
  },
  {
    id: 'total_100L',
    name: 'Vua Hydration',
    description: 'Tổng lượng nước đạt 100 Lít',
    icon: '👑',
    color: '#fbbf24',
    bgColor: 'rgba(251,191,36,0.15)',
    borderColor: 'rgba(251,191,36,0.3)',
    requirement: 100000,
    type: 'total',
    isUnlocked: false,
  },
  {
    id: 'total_500L',
    name: 'Huyền thoại Hydration',
    description: 'Tổng lượng nước đạt 500 Lít',
    icon: '🌟',
    color: '#e879f9',
    bgColor: 'rgba(232,121,249,0.15)',
    borderColor: 'rgba(232,121,249,0.3)',
    requirement: 500000,
    type: 'total',
    isUnlocked: false,
  },

  // Social Achievements
  {
    id: 'social_first_post',
    name: 'Chia sẻ đầu tiên',
    description: 'Đăng bài viết đầu tiên',
    icon: '📝',
    color: '#8b5cf6',
    bgColor: 'rgba(139,92,246,0.15)',
    borderColor: 'rgba(139,92,246,0.3)',
    requirement: 1,
    type: 'social',
    isUnlocked: false,
  },
  {
    id: 'social_10_followers',
    name: 'Người nổi tiếng',
    description: 'Có 10 người theo dõi',
    icon: '🌟',
    color: '#ec4899',
    bgColor: 'rgba(236,72,153,0.15)',
    borderColor: 'rgba(236,72,153,0.3)',
    requirement: 10,
    type: 'social',
    isUnlocked: false,
  },
  {
    id: 'social_mvp',
    name: 'Social MVP',
    description: 'Được 50 lượt thích trên bài viết',
    icon: '❤️',
    color: '#ef4444',
    bgColor: 'rgba(239,68,68,0.15)',
    borderColor: 'rgba(239,68,68,0.3)',
    requirement: 50,
    type: 'social',
    isUnlocked: false,
  },
];

// Kiểm tra và unlock achievements
export const checkAchievements = (
  currentAchievements: Achievement[],
  stats: {
    streak: number;
    totalMl: number;
    dailyPerfectDays: number;
    postsCount: number;
    followersCount: number;
    maxLikes: number;
  }
): { newAchievements: Achievement[]; updatedAchievements: Achievement[] } => {
  const newAchievements: Achievement[] = [];
  const updatedAchievements: Achievement[] = [];

  for (const achievement of ACHIEVEMENTS) {
    // Skip if already unlocked
    const existing = currentAchievements.find(a => a.id === achievement.id);
    if (existing?.isUnlocked) continue;

    let shouldUnlock = false;

    switch (achievement.type) {
      case 'streak':
        shouldUnlock = stats.streak >= achievement.requirement;
        break;
      case 'total':
        shouldUnlock = stats.totalMl >= achievement.requirement;
        break;
      case 'daily':
        shouldUnlock = stats.dailyPerfectDays >= achievement.requirement;
        break;
      case 'social':
        if (achievement.id === 'social_first_post') {
          shouldUnlock = stats.postsCount >= achievement.requirement;
        } else if (achievement.id === 'social_10_followers') {
          shouldUnlock = stats.followersCount >= achievement.requirement;
        } else if (achievement.id === 'social_mvp') {
          shouldUnlock = stats.maxLikes >= achievement.requirement;
        }
        break;
    }

    if (shouldUnlock) {
      const unlockedAchievement = {
        ...achievement,
        isUnlocked: true,
        unlockedAt: Date.now(),
      };
      newAchievements.push(unlockedAchievement);
      updatedAchievements.push(unlockedAchievement);
    }
  }

  return { newAchievements, updatedAchievements };
};

// Lưu achievements vào localStorage
export const saveAchievements = (userId: string, achievements: Achievement[]) => {
  localStorage.setItem(`digiwell_achievements_${userId}`, JSON.stringify(achievements));
};

// Load achievements từ localStorage
export const loadAchievements = (userId: string): Achievement[] => {
  try {
    const saved = localStorage.getItem(`digiwell_achievements_${userId}`);
    if (saved) {
      const savedAchievements = JSON.parse(saved);
      // Merge với ACHIEVEMENTS để đảm bảo có achievements mới
      return ACHIEVEMENTS.map(a => {
        const saved = savedAchievements.find((s: Achievement) => s.id === a.id);
        return saved || a;
      });
    }
  } catch (e) {
    console.error('Lỗi load achievements:', e);
  }
  return ACHIEVEMENTS;
};

// Get unlocked count
export const getUnlockedCount = (achievements: Achievement[]) => {
  return achievements.filter(a => a.isUnlocked).length;
};

// Get progress percentage
export const getProgressPercentage = (achievements: Achievement[]) => {
  const unlocked = getUnlockedCount(achievements);
  return Math.round((unlocked / achievements.length) * 100);
};

// Achievement badge component data
export type AchievementBadge = {
  id: string;
  icon: string;
  name: string;
  description: string;
  color: string;
  isUnlocked: boolean;
};

export const getAchievementBadges = (achievements: Achievement[]): AchievementBadge[] => {
  return achievements.map(a => ({
    id: a.id,
    icon: a.icon,
    name: a.name,
    description: a.description,
    color: a.color,
    isUnlocked: a.isUnlocked,
  }));
};
