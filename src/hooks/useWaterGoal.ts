import { useMemo } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useHealthStore } from '../store/useHealthStore';

export function useWaterGoal() {
  const { profile } = useAuthStore();
  const { isCalendarSynced, calendarEvents, isWatchConnected, watchData, isWeatherSynced, weatherData } = useHealthStore();

  const waterGoal = useMemo(() => {
    if (!profile) return 2000;
    let base = profile.weight * 35;

    const gymKeywords = ['gym', 'tập', 'chạy', 'yoga', 'bơi', 'thể dục', 'boxing', 'cycling', 'football', 'bóng'];

    if (isCalendarSynced) {
      const hasGymEvent = calendarEvents.some(e =>
        gymKeywords.some(kw => e.title.toLowerCase().includes(kw))
      );
      if (hasGymEvent) base += 800;
    } else if (isWatchConnected && watchData.steps > 0) {
      if (watchData.steps >= 8000 || watchData.heartRate >= 100) base += 800;
      else if (watchData.steps >= 4000 || watchData.heartRate >= 85) base += 400;
    }

    if (isWeatherSynced && weatherData.temp > 30) base += 500;
    else if (profile.climate?.includes('Nóng')) base += 200;

    return base;
  }, [profile, isCalendarSynced, calendarEvents, isWatchConnected, watchData, isWeatherSynced, weatherData.temp]);

  return waterGoal;
}
