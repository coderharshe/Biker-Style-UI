import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from './useStore';

export function useProfile() {
  const { profile, setProfile } = useStore();
  const [loading, setLoading] = useState(!profile);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      if (!profile) setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase.from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  return { profile, loading, error, refresh: fetchProfile };
}
