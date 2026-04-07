import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from './useStore';

export function useProfile() {
  const { profile, setProfile } = useStore();
  const [loading, setLoading] = useState(!profile);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && isMounted) {
        fetchProfile();
      } else if (isMounted) {
        setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  const fetchProfile = async (retryCount = 0) => {
    try {
      if (!profile) setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        // If it's a new user, the profile might still be being created by the trigger
        if (retryCount < 3) {
          setTimeout(() => fetchProfile(retryCount + 1), 1000);
          return;
        }
        throw error;
      }
      
      setProfile(data);
    } catch (e) {
      setError(e);
      console.error('Error fetching profile:', e);
    } finally {
      setLoading(false);
    }
  };

  return { profile, loading, error, refresh: fetchProfile };
}
