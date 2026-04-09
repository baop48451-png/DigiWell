import { create } from 'zustand';

interface HealthState {
  isWatchConnected: boolean;
  setIsWatchConnected: (connected: boolean) => void;
  watchData: { heartRate: number; steps: number };
  setWatchData: (data: { heartRate: number; steps: number }) => void;
  isWeatherSynced: boolean;
  setIsWeatherSynced: (synced: boolean) => void;
  weatherData: { temp: number; location: string; status: string };
  setWeatherData: (data: { temp: number; location: string; status: string }) => void;
  isCalendarSynced: boolean;
  setIsCalendarSynced: (synced: boolean) => void;
  calendarEvents: Array<{ time: string; title: string; location: string }>;
  setCalendarEvents: (events: any[]) => void;
}

export const useHealthStore = create<HealthState>((set) => ({
  isWatchConnected: false,
  setIsWatchConnected: (isWatchConnected) => set({ isWatchConnected }),
  watchData: { heartRate: 0, steps: 0 },
  setWatchData: (watchData) => set({ watchData }),
  isWeatherSynced: false,
  setIsWeatherSynced: (isWeatherSynced) => set({ isWeatherSynced }),
  weatherData: { temp: 28, location: 'TP. Hồ Chí Minh', status: 'Nắng nhẹ' },
  setWeatherData: (weatherData) => set({ weatherData }),
  isCalendarSynced: false,
  setIsCalendarSynced: (isCalendarSynced) => set({ isCalendarSynced }),
  calendarEvents: [],
  setCalendarEvents: (calendarEvents) => set({ calendarEvents }),
}));
