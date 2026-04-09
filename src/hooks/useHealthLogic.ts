import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Health } from '@capgo/capacitor-health';
import { useHealthStore } from '../store/useHealthStore';
import { useAuthStore } from '../store/useAuthStore';
import { useAndroidHealthLogic } from './useAndroidHealthLogic';

export function useHealthLogic() {
  const { isWatchConnected, setWatchData } = useHealthStore();
  const { profile } = useAuthStore();
  const { fetchAndroidHealthData } = useAndroidHealthLogic();

  useEffect(() => {
    if (!isWatchConnected) return;

    const fetchRealHealthData = async () => {
      const platform = Capacitor.getPlatform();
      
      if (platform === 'android') {
        await fetchAndroidHealthData();
        return;
      }

      if (platform !== 'ios') {
        // Fallback for Web
        setWatchData(prev => ({ 
          heartRate: Math.floor(Math.random() * 14) + 72, 
          steps: prev.steps + Math.floor(Math.random() * 3) 
        }));
        return;
      }

      try {
        await Health.requestAuthorization({
          read: ['steps', 'heartRate'],
          write: []
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const stepsRes = await Health.readSamples({
          dataType: 'steps',
          startDate: today.toISOString(),
          endDate: new Date().toISOString(),
          limit: 2000
        });
        const totalSteps = Array.isArray(stepsRes?.samples) 
          ? stepsRes.samples.reduce((sum: number, item: any) => sum + (item.value || 0), 0) 
          : 0;

        const hrRes = await Health.readSamples({
          dataType: 'heartRate',
          startDate: today.toISOString(),
          endDate: new Date().toISOString(),
          limit: 1
        });
        const latestHR = hrRes?.samples && hrRes.samples.length > 0 ? hrRes.samples[0].value : 75;

        setWatchData({ heartRate: Math.round(latestHR), steps: Math.round(totalSteps) });
      } catch (error) {
        console.error("Lỗi đọc Apple Health:", error);
      }
    };

    fetchRealHealthData();
    const interval = window.setInterval(fetchRealHealthData, 10000);
    return () => clearInterval(interval);
  }, [isWatchConnected, setWatchData, fetchAndroidHealthData]);

  return {};
}
