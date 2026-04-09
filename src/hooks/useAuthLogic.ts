import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';

export function useAuthLogic() {
  const { profile, setProfile, updateProfile, setIsUpdatingProfile } = useAuthStore();
  const { setView } = useUIStore();

  const loadProfile = async (userId: string) => {
    try {
      const { data: p, error: pErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (pErr || !p) return null;
      
      return {
        id: p.id, 
        nickname: p.nickname, 
        password: '', 
        gender: p.gender,
        age: p.age, 
        height: p.height, 
        weight: p.weight, 
        activity: p.activity,
        climate: p.climate, 
        goal: p.goal, 
        wakeUp: p.wake_up, 
        bedTime: p.bed_time
      };
    } catch {
      return null;
    }
  };

  const handleAuthChange = (event: string, session: any) => {
    if (session) {
      if (session.provider_token) {
        localStorage.setItem('google_provider_token', session.provider_token);
      }

      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') {
        (async () => {
          let p = await loadProfile(session.user.id);
          
          if (!p && session.user) {
            const defaultName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User';
            await supabase.from('profiles').upsert([{
              id: session.user.id, 
              nickname: defaultName, 
              gender: 'Nam', 
              age: 20, 
              height: 170, 
              weight: 60,
              activity: 'active', 
              climate: 'Nhiệt đới (Nóng)', 
              goal: 'Sức khỏe tổng quát'
            }], { onConflict: 'id' });
            p = await loadProfile(session.user.id);
          }

          if (p) {
            setProfile(p);
            setView('app');
          }
        })();
      }
    } else {
      setProfile(null);
      setView('welcome');
      localStorage.removeItem('google_provider_token');
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);
    return () => subscription.unsubscribe();
  }, []);

  const updateProfileData = async (updates: any) => {
    if (!profile?.id) return;
    
    setIsUpdatingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id);
      
      if (error) throw error;
      updateProfile(updates);
    } catch (err) {
      throw err;
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  return {
    updateProfileData
  };
}
