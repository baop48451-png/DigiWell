/**
 * Water Storage & Cloud Sync Module
 * 
 * Cung cấp các functions để:
 * 1. Lưu trữ local (localStorage) - offline-first
 * 2. Đồng bộ lên Supabase (cloud)
 * 3. Realtime sync giữa các thiết bị (Messenger-style)
 */

export type WaterEntry = {
  id: string;
  amount: number;
  actual_ml?: number;
  name?: string;
  timestamp: number;
};

// Cloud entry format (từ Supabase)
export type CloudWaterEntry = {
  id: string;
  user_id: string;
  amount: number;
  actual_ml: number;
  name: string;
  timestamp: string; // ISO string
  day: string;
  created_at: string;
};

export type PendingWaterSync = {
  userId: string;
  day: string;
  total: number;
  updatedAt: number;
};

// Pending entry sync (khi offline)
export type PendingEntrySync = {
  userId: string;
  entry: WaterEntry;
  action: 'insert' | 'update' | 'delete';
  updatedAt: number;
};

const PENDING_WATER_SYNC_STORAGE_KEY = 'digiwell_pending_water_syncs';
const PENDING_ENTRIES_SYNC_KEY = 'digiwell_pending_entries_sync';

// FIX: Dùng local timezone thay vì UTC để tránh lệch ngày khi user ở UTC+7
export const getTodayWaterDay = (date: Date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getWaterDayFromTimestamp = (timestamp: number) => {
  return getTodayWaterDay(new Date(timestamp));
};

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

// ============================================================================
// CLOUD SYNC HELPERS
// ============================================================================

/**
 * Chuyển đổi từ CloudWaterEntry (Supabase) sang WaterEntry (local)
 */
export const cloudEntryToLocal = (cloud: CloudWaterEntry): WaterEntry => ({
  id: cloud.id,
  amount: cloud.amount,
  actual_ml: cloud.actual_ml,
  name: cloud.name,
  timestamp: new Date(cloud.timestamp).getTime(),
});

/**
 * Chuyển đổi từ WaterEntry (local) sang format insert Supabase
 */
export const localEntryToCloudInsert = (entry: WaterEntry, userId: string, day: string) => ({
  id: entry.id, // Dùng local ID để tránh conflict
  user_id: userId,
  amount: entry.amount,
  actual_ml: entry.actual_ml || entry.amount,
  name: entry.name || 'Nước lọc',
  timestamp: new Date(entry.timestamp).toISOString(),
  day: day,
});

// ============================================================================
// PENDING SYNC (OFFLINE SUPPORT)
// ============================================================================

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

// ============================================================================
// PENDING ENTRIES SYNC (CHI TIẾT TỪNG LY NƯỚC)
// ============================================================================

const readPendingEntriesSync = (): PendingEntrySync[] => {
  try {
    return JSON.parse(localStorage.getItem(PENDING_ENTRIES_SYNC_KEY) || '[]');
  } catch {
    return [];
  }
};

const writePendingEntriesSync = (syncs: PendingEntrySync[]) => {
  localStorage.setItem(PENDING_ENTRIES_SYNC_KEY, JSON.stringify(syncs));
};

export const addPendingEntrySync = (userId: string, entry: WaterEntry, action: 'insert' | 'update' | 'delete') => {
  const syncs = readPendingEntriesSync();
  // Remove existing sync for same entry ID
  const filtered = syncs.filter(s => s.entry.id !== entry.id);
  filtered.push({ userId, entry, action, updatedAt: Date.now() });
  writePendingEntriesSync(filtered);
};

export const removePendingEntrySync = (entryId: string) => {
  const syncs = readPendingEntriesSync();
  writePendingEntriesSync(syncs.filter(s => s.entry.id !== entryId));
};

export const getPendingEntrySyncs = (userId?: string): PendingEntrySync[] => {
  const syncs = readPendingEntriesSync();
  return userId ? syncs.filter(s => s.userId === userId) : syncs;
};

export const clearPendingEntrySyncs = (userId?: string) => {
  if (userId) {
    const syncs = readPendingEntriesSync();
    writePendingEntriesSync(syncs.filter(s => s.userId !== userId));
  } else {
    localStorage.removeItem(PENDING_ENTRIES_SYNC_KEY);
  }
};

// ============================================================================
// MERGE STRATEGIES (KHI CÓ CONFLICT LOCAL VS CLOUD)
// ============================================================================

/**
 * Merge local entries với cloud entries
 * Strategy: Cloud wins cho cùng timestamp, local thêm mới giữ nguyên
 */
export const mergeLocalAndCloudEntries = (
  local: WaterEntry[],
  cloud: CloudWaterEntry[]
): WaterEntry[] => {
  const merged = new Map<string, WaterEntry>();

  // Add all cloud entries first
  for (const c of cloud) {
    merged.set(c.id, cloudEntryToLocal(c));
  }

  // Merge local entries (local wins for its own entries)
  for (const l of local) {
    const existing = merged.get(l.id);
    if (!existing) {
      // New local entry not in cloud - keep it
      merged.set(l.id, l);
    } else {
      // Entry exists in both - use cloud as source of truth (more accurate timestamp)
      // But keep local data if cloud timestamp is similar
      const cloudTime = new Date(existing.timestamp).getTime();
      const localTime = l.timestamp;
      if (Math.abs(cloudTime - localTime) < 1000) {
        // Within 1 second - merge data, preferring cloud for actual_ml
        merged.set(l.id, {
          ...l,
          actual_ml: existing.actual_ml,
          name: existing.name,
        });
      }
      // If significantly different, cloud wins
    }
  }

  return Array.from(merged.values()).sort((a, b) => a.timestamp - b.timestamp);
};

// ============================================================================
// LỊCH SỬ UỐNG NƯỚC HÀNG NGÀY (30 NGÀY)
// ============================================================================

export type DailyWaterSummary = {
  day: string;        // YYYY-MM-DD
  date: Date;         // Date object
  totalMl: number;
  goalMl: number;
  entryCount: number;
  percentage: number;  // % hoàn thành
};

export const loadMonthlyWaterHistory = (userId: string): DailyWaterSummary[] => {
  const result: DailyWaterSummary[] = [];
  const today = new Date();
  
  // Load 30 ngày gần nhất
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const day = getTodayWaterDay(date);
    
    const entries = loadStoredWaterEntries(userId, day);
    const totalMl = calculateWaterTotal(entries);
    
    result.push({
      day,
      date,
      totalMl,
      goalMl: 0, // Sẽ được set từ App
      entryCount: entries.length,
      percentage: 0,
    });
  }
  
  return result;
};

// Lấy lịch sử từ Supabase (khi online)
export const fetchMonthlyWaterHistoryFromCloud = async (supabaseClient: any, userId: string) => {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data, error } = await supabaseClient
      .from('water_logs')
      .select('day, intake_ml')
      .eq('user_id', userId)
      .gte('day', getTodayWaterDay(thirtyDaysAgo))
      .lte('day', getTodayWaterDay(today))
      .order('day', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map((row: any) => ({
      day: row.day,
      totalMl: row.intake_ml || 0,
    }));
  } catch (err) {
    console.error('Lỗi fetch monthly history:', err);
    return [];
  }
};
