import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from './useStore';

export function useProfile() {
  const { profile, setProfile } = useStore();
  const [loading, setLoading] = useState(!profile);
  const [error, setError] = useState<any>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && isMountedRef.current) {
          fetchProfile();
        } else if (isMountedRef.current) {
          setLoading(false);
        }
      } catch (err) {
        console.warn('[Profile] Session check error:', err);
        if (isMountedRef.current) setLoading(false);
      }
    };

    load();
    return () => { isMountedRef.current = false; };
  }, []);

  const fetchProfile = async (retryCount = 0) => {
    try {
      if (!profile) setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (isMountedRef.current) setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase.from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        // If it's a new user, the profile might still be being created by the trigger
        if (retryCount < 3) {
          setTimeout(() => {
            if (isMountedRef.current) fetchProfile(retryCount + 1);
          }, 1000);
          return;
        }
        throw fetchError;
      }
      
      if (isMountedRef.current) {
        setProfile(data);
      }
    } catch (e) {
      if (isMountedRef.current) {
        setError(e);
      }
      console.error('[Profile] Error fetching:', e);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  return { profile, loading, error, refresh: fetchProfile };
}
