import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from './useStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useRide() {
  const { activeRideId, setActiveRideId } = useStore();
  const [loading, setLoading] = useState(false);

  const startRide = useCallback(async (): Promise<string | null> => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('rides')
        .insert({
          user_id: user.id,
          distance: 0,
          avg_speed: 0,
          status: 'active',
        })
        .select('id')
        .single();

      if (error) throw error;
      
      const newRideId = data.id;
      setActiveRideId(newRideId);
      // Also sync to AsyncStorage for the background task to access quickly
      await AsyncStorage.setItem('active_ride_id', newRideId);
      
      return newRideId;
    } catch (err) {
      console.error("Error starting ride:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const endRide = useCallback(async (distanceKm: number): Promise<boolean> => {
    if (!activeRideId) return false;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('rides')
        .update({
          status: 'completed',
          end_time: new Date().toISOString(),
          distance: parseFloat(distanceKm.toFixed(2))
        })
        .eq('id', activeRideId);

      if (error) throw error;
      
      setActiveRideId(null);
      await AsyncStorage.removeItem('active_ride_id');
      return true;
    } catch (err) {
      console.error("Error ending ride:", err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [activeRideId]);

  return { activeRideId, startRide, endRide, loading };
}
