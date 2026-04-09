import { create } from 'zustand';
import { LocalWaterEntry } from '../types';

interface DrinkPreset {
  id: string;
  name: string;
  amount: number;
  factor: number;
  icon: string;
  color: string;
}

interface HydrationState {
  waterIntake: number;
  setWaterIntake: (intake: number) => void;
  waterEntries: LocalWaterEntry[];
  setWaterEntries: (entries: LocalWaterEntry[]) => void;
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  editingEntry: LocalWaterEntry | null;
  setEditingEntry: (entry: LocalWaterEntry | null) => void;
  editAmount: string;
  setEditAmount: (amount: string) => void;
  drinkPresets: DrinkPreset[];
  setDrinkPresets: (presets: DrinkPreset[]) => void;
  showCustomDrink: boolean;
  setShowCustomDrink: (show: boolean) => void;
  customDrinkForm: { name: string; amount: number | string; factor: number };
  setCustomDrinkForm: (form: Partial<HydrationState['customDrinkForm']>) => void;
}

export const useHydrationStore = create<HydrationState>((set) => ({
  waterIntake: 0,
  setWaterIntake: (waterIntake) => set({ waterIntake }),
  waterEntries: [],
  setWaterEntries: (waterEntries) => set({ waterEntries }),
  showHistory: false,
  setShowHistory: (showHistory) => set({ showHistory }),
  editingEntry: null,
  setEditingEntry: (editingEntry) => set({ editingEntry }),
  editAmount: '',
  setEditAmount: (editAmount) => set({ editAmount }),
  drinkPresets: [],
  setDrinkPresets: (drinkPresets) => set({ drinkPresets }),
  showCustomDrink: false,
  setShowCustomDrink: (showCustomDrink) => set({ showCustomDrink }),
  customDrinkForm: { name: 'Trà đào', amount: 300, factor: 1.0 },
  setCustomDrinkForm: (updates) => set((state) => ({
    customDrinkForm: { ...state.customDrinkForm, ...updates },
  })),
}));
