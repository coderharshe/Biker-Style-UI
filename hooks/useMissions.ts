import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useProfile } from './useProfile';

export interface Mission {
  id: string;
  title: string;
  description: string;
  xp_reward: number;
  icon: string;
  category: string;
  done?: boolean;
}

export function useMissions() {
  const { profile, refresh } = useProfile();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMissions();
  }, [profile?.id]);

  const fetchMissions = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);

      // Get today's start date string
      const today = new Date();
      today.setHours(0,0,0,0);
      const todayStr = today.toISOString();

      // Fetch all missions
      const { data: allMissions, error: missionsError } = await supabase
        .from('missions')
        .select('*');

      if (missionsError) throw missionsError;

      // Fetch completed missions for today
      const { data: userMissions, error: umError } = await supabase
        .from('user_missions')
        .select('mission_id')
        .eq('user_id', profile.id)
        .gte('completed_at', todayStr);

      if (umError) throw umError;

      const completedIds = new Set(userMissions.map(m => m.mission_id));

      const mergedMissions: Mission[] = allMissions.map(m => ({
        ...m,
        done: completedIds.has(m.id)
      }));

      setMissions(mergedMissions);
    } catch (error) {
      console.error('Error fetching missions:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeMission = async (missionId: string, xpReward: number) => {
    if (!profile?.id) return;
    try {
      // Complete mission
      const { error: insertError } = await supabase
        .from('user_missions')
        .insert({
          user_id: profile.id,
          mission_id: missionId,
        });

      if (insertError) {
        if (insertError.code === '23505') { // unique violation
          console.log("Already completed today");
          return;
        }
        throw insertError;
      }

      // Add XP to profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ xp: (profile.xp || 0) + xpReward })
        .eq('id', profile.id);

      if (updateError) throw updateError;
      
      // Update local state and profile
      setMissions(prev => prev.map(m => m.id === missionId ? { ...m, done: true } : m));
      refresh();
    } catch (error) {
      console.error('Error completing mission:', error);
    }
  };

  return { missions, completeMission, loading };
}
