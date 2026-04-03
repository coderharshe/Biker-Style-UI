import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import * as Location from 'expo-location';

export function useSOS() {
  const [activeSOS, setActiveSOS] = useState<any[]>([]);

  useEffect(() => {
    fetchActiveSOS();

    const channelName = `sos-alerts-realtime-${Math.random()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sos_alerts' },
        () => {
          fetchActiveSOS();
        }
      )
      .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, []);

  const fetchActiveSOS = async () => {
    const { data } = await supabase
      .from('sos_alerts')
      .select('*, profiles(username)')
      .eq('status', 'active');
    
    if (data) setActiveSOS(data);
  };

  const triggerSOS = async (rideId?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const loc = await Location.getCurrentPositionAsync({});
    
    const { error } = await supabase.from('sos_alerts').insert({
      user_id: user.id,
      ride_id: rideId,
      lat: loc.coords.latitude,
      lng: loc.coords.longitude,
      status: 'active'
    });

    if (error) throw error;
  };

  const resolveSOS = async (sosId: string) => {
    const { error } = await supabase
      .from('sos_alerts')
      .update({ status: 'resolved' })
      .eq('id', sosId);
    
    if (error) throw error;
  };

  return { activeSOS, triggerSOS, resolveSOS };
}
