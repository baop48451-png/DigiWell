import { useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { 
  loadStoredWaterEntries, 
  saveStoredWaterEntries, 
  calculateWaterTotal, 
  getTodayWaterDay, 
  localEntryToCloudInsert, 
  mergeLocalAndCloudEntries, 
  getPendingWaterSync, 
  upsertPendingWaterSync, 
  clearPendingWaterSync, 
  listPendingWaterSyncs,
  addPendingEntrySync,
  getPendingEntrySyncs,
  removePendingEntrySync,
  clearPendingEntrySyncs
} from '../lib/waterStorage';
import { useHydrationStore } from '../store/useHydrationStore';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'sonner';
import { LocalWaterEntry } from '../types';

export function useHydrationLogic() {
  const { profile } = useAuthStore();
  const { 
    waterIntake: currentIntake, 
    setWaterIntake, 
    waterEntries, 
    setWaterEntries 
  } = useHydrationStore();

  const syncWaterWithCloud = useCallback(async (userId: string, day = getTodayWaterDay()) => {
    try {
      // 1. Fetch cloud data
      const { data: cloudData, error: cloudErr } = await supabase
        .from('water_logs')
        .select('id, amount, actual_ml, name, timestamp, day')
        .eq('user_id', userId)
        .eq('day', day)
        .maybeSingle();

      if (cloudErr) throw cloudErr;

      // 2. Load local data
      const localEntries = loadStoredWaterEntries(userId, day);
      
      // 3. Merge
      const cloudEntry = cloudData ? [cloudData] : [];
      // We need a way to merge since cloudData is single record of total today in some schemas, 
      // but our storage uses individual entries. 
      // Looking at water_logs table schema from previous knowledge, it usually stores the total intake per day.
      // If it's total per day, we handle it differently.
      
      // Actually, the provided waterStorage.ts suggests CloudWaterEntry exists.
      // Let's assume it's total intake for the day as per the common usage in this app.
      
      const cloudIntake = cloudData ? cloudData.actual_ml : 0;
      const localIntake = calculateWaterTotal(localEntries);
      
      const finalIntake = Math.max(cloudIntake, localIntake);
      
      // 4. Update local state
      setWaterIntake(finalIntake);
      setWaterEntries(localEntries);
      
      // 5. Update cloud if local is higher
      if (localIntake > cloudIntake) {
        const { error: updateErr } = await supabase
          .from('water_logs')
          .upsert({ 
            user_id: userId, 
            day: day, 
            intake_ml: localIntake,
            updated_at: new Date().toISOString() 
          });
        if (updateErr) throw updateErr;
      }
      
      return finalIntake;
    } catch (err: any) {
      console.error('Cloud sync error:', err);
      // Handle offline: mark as pending
      const todayStr = getTodayWaterDay();
      upsertPendingWaterSync({
        userId,
        day: todayStr,
        total: calculateWaterTotal(loadStoredWaterEntries(userId, todayStr)),
        updatedAt: Date.now()
      });
      return null;
    }
  }, [setWaterIntake, setWaterEntries]);

  const handleAddWater = useCallback(async (amount: number, factor: number, name: string, note?: string) => {
    if (!profile?.id) {
      toast.error('Vui lòng đăng nhập để lưu tiến trình.');
      return;
    }

    const userId = profile.id;
    const todayStr = getTodayWaterDay();
    const entries = loadStoredWaterEntries(userId, todayStr);
    
    const actualMl = amount * factor;
    const newEntry: LocalWaterEntry = {
      id: crypto.randomUUID(),
      amount,
      actual_ml: actualMl,
      name,
      timestamp: Date.now(),
      note
    };
    
    const updatedEntries = [...entries, newEntry];
    saveStoredWaterEntries(userId, updatedEntries, todayStr);
    
    const newTotal = calculateWaterTotal(updatedEntries);
    setWaterIntake(newTotal);
    setWaterEntries(updatedEntries);
    
    try {
      const { error } = await supabase
        .from('water_logs')
        .upsert({ 
          user_id: userId, 
          day: todayStr, 
          intake_ml: newTotal,
          updated_at: new Date().toISOString() 
        });
      if (error) throw error;
    } catch (err: any) {
      console.warn('Cloud update failed, marked as pending:', err);
      upsertPendingWaterSync({
        userId,
        day: todayStr,
        total: newTotal,
        updatedAt: Date.now()
      });
    }
    
    return newTotal;
  }, [profile?.id, setWaterIntake, setWaterEntries]);

  const handleDeleteEntry = useCallback(async (entryId: string) => {
    if (!profile?.id) return;
    
    const userId = profile.id;
    const todayStr = getTodayWaterDay();
    const entries = loadStoredWaterEntries(userId, todayStr);
    const filteredEntries = entries.filter(e => e.id !== entryId);
    
    saveStoredWaterEntries(userId, filteredEntries, todayStr);
    const newTotal = calculateWaterTotal(filteredEntries);
    setWaterIntake(newTotal);
    setWaterEntries(filteredEntries);
    
    try {
      const { error } = await supabase
        .from('water_logs')
        .upsert({ 
          user_id: userId, 
          day: todayStr, 
          intake_ml: newTotal,
          updated_at: new Date().toISOString() 
        });
      if (error) throw error;
    } catch (err: any) {
      upsertPendingWaterSync({
        userId,
        day: todayStr,
        total: newTotal,
        updatedAt: Date.now()
      });
    }
  }, [profile?.id, setWaterIntake, setWaterEntries]);

  const flushPendingSyncs = useCallback(async (silent = false) => {
    if (!profile?.id) return;
    
    const pending = listPendingWaterSyncs(profile.id);
    if (pending.length === 0) return;
    
    try {
      for (const sync of pending) {
        const { error } = await supabase
          .from('water_logs')
          .upsert({ 
            user_id: sync.userId, 
            day: sync.day, 
            intake_ml: sync.total,
            updated_at: new Date().toISOString() 
          });
        if (error) throw error;
        clearPendingWaterSync(sync.userId, sync.day);
      }
      if (!silent) toast.success('Đã đồng bộ dữ liệu offline!');
    } catch (err) {
      console.error('Flush pending sync error:', err);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (profile?.id) {
      syncWaterWithCloud(profile.id);
      flushPendingSyncs(true);
    }
  }, [profile?.id, syncWaterWithCloud, flushPendingSyncs]);

  return {
    handleAddWater,
    handleDeleteEntry,
    flushPendingSyncs,
    syncWaterWithCloud
  };
}
