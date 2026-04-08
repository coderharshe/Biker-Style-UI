import { useEffect, useState, useRef } from 'react';
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
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const fetchLatestPositions = async () => {
      try {
        // Only fetch recent ride points (last 30 minutes) to avoid performance issues
        const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

        const { data, error } = await supabase
          .from('ride_points')
          .select('user_id, lat, lng, speed, created_at')
          .gte('created_at', thirtyMinAgo)
          .order('created_at', { ascending: false })
          .limit(200); // Cap the results

        if (error) {
          console.warn('[RiderLocations] Fetch error:', error.message);
          return;
        }

        if (data && isMountedRef.current) {
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
      } catch (err) {
        console.warn('[RiderLocations] Fetch error:', err);
      }
    };

    fetchLatestPositions();

    const channelName = `ride-points-realtime-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ride_points' },
        (payload) => {
          if (!isMountedRef.current) return;

          const newPoint = payload.new as {
            user_id: string;
            lat: number;
            lng: number;
            speed: number | null;
            created_at: string;
          };

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
      isMountedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { riderLocations: Object.values(riderLocations) };
}
