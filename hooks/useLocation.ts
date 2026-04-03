import { useEffect, useState, useRef } from 'react';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';

export function useLocation(rideId?: string) {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);

      // Start watching location
      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        async (newLocation) => {
          setLocation(newLocation);
          
          if (rideId) {
            // Sync to Supabase
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await supabase.from('ride_points').insert({
                ride_id: rideId,
                user_id: user.id,
                lat: newLocation.coords.latitude,
                lng: newLocation.coords.longitude,
                alt: newLocation.coords.altitude,
                speed: newLocation.coords.speed,
              });
            }
          }
        }
      );
    })();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
      }
    };
  }, [rideId]);

  return { location, errorMsg };
}
