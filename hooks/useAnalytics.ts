import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useProfile } from './useProfile';

export interface AnalyticsData {
  weeklyKM: number;
  rideHours: number;
  safetyScore: number;
  serviceDueKM: number;
  tireHealth: number;
  fuelEfficiency: string;
}

const defaultAnalytics: AnalyticsData = {
  weeklyKM: 0,
  rideHours: 0,
  safetyScore: 100,
  serviceDueKM: 500,
  tireHealth: 100,
  fuelEfficiency: '25 km/l',
};

export function useAnalytics() {
  const { profile } = useProfile();
  const [analytics, setAnalytics] = useState<AnalyticsData>(defaultAnalytics);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    if (profile?.id) {
      fetchAnalytics();
    }
    return () => { isMountedRef.current = false; };
  }, [profile?.id]);

  const fetchAnalytics = async () => {
    if (!profile?.id) return;
    try {
      setLoading(true);

      // 1. Fetch Bike Analytics configuration
      const { data: bikeData, error: bikeError } = await supabase
        .from('bike_analytics')
        .select('*')
        .eq('user_id', profile.id)
        .single();

      let currentBikeData = bikeData;

      if (bikeError && bikeError.code === 'PGRST116') {
        // No row found, let's create a default one
        const { data: newData, error: insertError } = await supabase
          .from('bike_analytics')
          .insert({ user_id: profile.id })
          .select()
          .single();
        
        if (!insertError && newData) {
          currentBikeData = newData;
        }
      }

      // 2. Calculate Weekly KM from Rides
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: recentRides, error: ridesError } = await supabase
        .from('rides')
        .select('distance, start_time, end_time')
        .eq('user_id', profile.id)
        .gte('start_time', oneWeekAgo)
        .not('end_time', 'is', null);

      let weeklyKM = 0;
      let extraRideHours = 0;

      if (recentRides && !ridesError) {
        recentRides.forEach(ride => {
          weeklyKM += ride.distance || 0;
          if (ride.start_time && ride.end_time) {
             const diff = new Date(ride.end_time).getTime() - new Date(ride.start_time).getTime();
             extraRideHours += diff / (1000 * 60 * 60);
          }
        });
      }

      const safeHours = (currentBikeData?.total_ride_hours || 0) + extraRideHours;

      if (isMountedRef.current) {
        setAnalytics({
          weeklyKM: Math.round(weeklyKM),
          rideHours: parseFloat(safeHours.toFixed(1)),
          safetyScore: currentBikeData?.safety_score ?? 100,
          serviceDueKM: currentBikeData?.service_due_km ?? 500,
          tireHealth: currentBikeData?.tire_health ?? 100,
          fuelEfficiency: currentBikeData?.fuel_efficiency ?? '25 km/l'
        });
      }
    } catch (err) {
      console.error('[Analytics] Fetch error:', err);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  return { analytics, loading, refetch: fetchAnalytics };
}
