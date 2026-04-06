export type WaterEntry = {
  id: string;
  amount: number;
  actual_ml?: number;
  name?: string;
  timestamp: number;
};

export type PendingWaterSync = {
  userId: string;
  day: string;
  total: number;
  updatedAt: number;
};

const PENDING_WATER_SYNC_STORAGE_KEY = 'digiwell_pending_water_syncs';

export const getTodayWaterDay = () => new Date().toISOString().split('T')[0];

export const getWaterEntriesStorageKey = (userId: string, day = getTodayWaterDay()) =>
  `digiwell_entries_${userId}_${day}`;

export const calculateWaterTotal = (entries: WaterEntry[]) =>
  Math.max(0, entries.reduce((sum, entry) => sum + (entry.actual_ml || entry.amount), 0));

export const loadStoredWaterEntries = (userId: string, day = getTodayWaterDay()): WaterEntry[] => {
  try {
    const raw = localStorage.getItem(getWaterEntriesStorageKey(userId, day));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveStoredWaterEntries = (userId: string, entries: WaterEntry[], day = getTodayWaterDay()) => {
  localStorage.setItem(getWaterEntriesStorageKey(userId, day), JSON.stringify(entries));
};

const readPendingWaterSyncMap = (): Record<string, PendingWaterSync> => {
  try {
    return JSON.parse(localStorage.getItem(PENDING_WATER_SYNC_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};

const writePendingWaterSyncMap = (value: Record<string, PendingWaterSync>) => {
  localStorage.setItem(PENDING_WATER_SYNC_STORAGE_KEY, JSON.stringify(value));
};

const buildPendingWaterSyncKey = (userId: string, day: string) => `${userId}:${day}`;

export const getPendingWaterSync = (userId: string, day = getTodayWaterDay()) => {
  const syncs = readPendingWaterSyncMap();
  return syncs[buildPendingWaterSyncKey(userId, day)] || null;
};

export const upsertPendingWaterSync = (sync: PendingWaterSync) => {
  const syncs = readPendingWaterSyncMap();
  syncs[buildPendingWaterSyncKey(sync.userId, sync.day)] = sync;
  writePendingWaterSyncMap(syncs);
};

export const clearPendingWaterSync = (userId: string, day = getTodayWaterDay()) => {
  const syncs = readPendingWaterSyncMap();
  delete syncs[buildPendingWaterSyncKey(userId, day)];
  writePendingWaterSyncMap(syncs);
};

export const listPendingWaterSyncs = (userId?: string) => {
  const syncs = Object.values(readPendingWaterSyncMap());
  return userId ? syncs.filter(sync => sync.userId === userId) : syncs;
};
