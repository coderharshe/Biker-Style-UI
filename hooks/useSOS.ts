import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

export function useSOS() {
  const [activeSOS, setActiveSOS] = useState<any[]>([]);
  const [sosStats, setSosStats] = useState({ avgResponseTime: '4 min', availableHelpers: 0 });
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    fetchActiveSOS();
    fetchSOSStats();

    const channelName = `sos-alerts-realtime-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sos_alerts' },
        () => {
          if (isMountedRef.current) {
            fetchActiveSOS();
            fetchSOSStats();
          }
        }
      )
      .subscribe();

    return () => {
      isMountedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSOSStats = async () => {
    try {
      // Fetch recently resolved SOS to calculate average response time
      const { data: resolvedSos } = await supabase
        .from('sos_alerts')
        .select('created_at, resolved_at')
        .eq('status', 'resolved')
        .not('resolved_at', 'is', null)
        .order('resolved_at', { ascending: false })
        .limit(20);

      let avgMins = 4; // default fallback
      if (resolvedSos && resolvedSos.length > 0) {
        const totalMs = resolvedSos.reduce((acc, sos) => {
          const diff = new Date(sos.resolved_at).getTime() - new Date(sos.created_at).getTime();
          return acc + diff;
        }, 0);
        avgMins = Math.max(1, Math.round(totalMs / resolvedSos.length / 60000));
      }

      // Estimate available helpers via active ride points within last 15 mins (simple query)
      const fifteenMinsAgo = new Date(Date.now() - 15 * 60000).toISOString();
      const { count } = await supabase
        .from('ride_points')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', fifteenMinsAgo);

      if (isMountedRef.current) {
        setSosStats({ 
          avgResponseTime: `${avgMins} min`, 
          availableHelpers: count || 0 
        });
      }
    } catch (err) {
      console.warn('[SOS] Stats fetch error:', err);
    }
  };

  const fetchActiveSOS = async () => {
    try {
      const { data, error } = await supabase
        .from('sos_alerts')
        .select('*, profiles(username)')
        .eq('status', 'active');

      if (error) {
        console.warn('[SOS] Fetch error:', error.message);
        return;
      }

      if (data && isMountedRef.current) {
        setActiveSOS(data);
      }
    } catch (err) {
      console.warn('[SOS] Fetch error:', err);
    }
  };

  const triggerSOS = async (rideId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to trigger SOS.');
      }

      // Get location with timeout fallback
      let loc: Location.LocationObject | null = null;
      try {
        loc = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error('Location timeout')), 10_000)
          ),
        ]);
      } catch {
        // Fallback: try last known location
        loc = await Location.getLastKnownPositionAsync().catch(() => null);
      }

      if (!loc) {
        Alert.alert('Location Unavailable', 'Could not determine your location for the SOS alert. Please enable location services.');
        return;
      }

      const { error } = await supabase.from('sos_alerts').insert({
        user_id: user.id,
        ride_id: rideId ?? null,
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        status: 'active',
      });

      if (error) throw error;
    } catch (err) {
      console.error('[SOS] Trigger error:', err);
      throw err;
    }
  };

  const resolveSOS = async (sosId: string) => {
    try {
      const { error } = await supabase
        .from('sos_alerts')
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('id', sosId);
      
      if (error) throw error;
    } catch (err) {
      console.error('[SOS] Resolve error:', err);
      throw err;
    }
  };

  return { activeSOS, sosStats, triggerSOS, resolveSOS };
}
