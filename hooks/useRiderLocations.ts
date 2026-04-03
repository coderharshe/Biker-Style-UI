import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface RiderLocation {
  user_id: string;
  lat: number;
  lng: number;
  speed: number | null;
  updated_at: string;
}

export function useRiderLocations() {
  const [riderLocations, setRiderLocations] = useState<Record<string, RiderLocation>>({});

  useEffect(() => {
    // Initial fetch of active ride points
    const fetchLatestPositions = async () => {
      const { data, error } = await supabase
        .from('ride_points')
        .select('user_id, lat, lng, speed, created_at')
        .order('created_at', { ascending: false });

      if (data) {
        const latest: Record<string, RiderLocation> = {};
        data.forEach((p) => {
          if (!latest[p.user_id]) {
            latest[p.user_id] = {
              user_id: p.user_id,
              lat: p.lat,
              lng: p.lng,
              speed: p.speed,
              updated_at: p.created_at,
            };
          }
        });
        setRiderLocations(latest);
      }
    };

    fetchLatestPositions();

    // Subscribe to real-time updates
    const channelName = `ride-points-realtime-${Math.random()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ride_points' },
        (payload) => {
          const newPoint = payload.new as any;
          setRiderLocations((prev) => ({
            ...prev,
            [newPoint.user_id]: {
              user_id: newPoint.user_id,
              lat: newPoint.lat,
              lng: newPoint.lng,
              speed: newPoint.speed,
              updated_at: newPoint.created_at,
            },
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { riderLocations: Object.values(riderLocations) };
}
