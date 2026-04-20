import { useEffect, useState, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { requestForegroundLocation } from '@/lib/permissions';
import { LOCATION_TRACKING_TASK } from '@/lib/locationTask';

// ─── Haversine Distance ────────────────────────────────
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

// ─── Hook ──────────────────────────────────────────────
export function useLocation(rideId?: string | null) {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentDistance, setCurrentDistance] = useState(0);

  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const lastLocationRef = useRef<Location.LocationObject | null>(null);
  const previousRideIdRef = useRef<string | null | undefined>(undefined);
  const isMountedRef = useRef(true);

  // ─ Background Task Management (with proper await + try/catch) ─
  const startBackgroundTracking = useCallback(async () => {
    if (Platform.OS === 'web') return;
    
    try {
      if (rideId) {
        await AsyncStorage.setItem('active_ride_id', rideId);
      }
      
      const isRegistered = await Location.hasStartedLocationUpdatesAsync(LOCATION_TRACKING_TASK);
      if (!isRegistered) {
        await Location.startLocationUpdatesAsync(LOCATION_TRACKING_TASK, {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 10000,
          distanceInterval: 10,
          foregroundService: {
            notificationTitle: 'Velox Tracking',
            notificationBody: 'Tracking your ride in the background...',
            notificationColor: '#FF6B2C',
          },
          pausesUpdatesAutomatically: false,
        });
      }
    } catch (err) {
      console.warn('[Location] Failed to start background tracking:', err);
    }
  }, [rideId]);

  const stopBackgroundTracking = useCallback(async () => {
    if (Platform.OS === 'web') return;
    
    try {
      await AsyncStorage.removeItem('active_ride_id');
      const isRegistered = await Location.hasStartedLocationUpdatesAsync(LOCATION_TRACKING_TASK);
      if (isRegistered) {
        await Location.stopLocationUpdatesAsync(LOCATION_TRACKING_TASK);
      }
    } catch (err) {
      console.warn('[Location] Failed to stop background tracking:', err);
    }
  }, []);

  // ─ Ride lifecycle management ─
  useEffect(() => {
    if (rideId && rideId !== previousRideIdRef.current) {
      setCurrentDistance(0);
      lastLocationRef.current = location;
      startBackgroundTracking().catch(console.warn);
    } else if (!rideId && previousRideIdRef.current) {
      stopBackgroundTracking().catch(console.warn);
    }
    previousRideIdRef.current = rideId;
  }, [rideId, startBackgroundTracking, stopBackgroundTracking]);

  // ─ Foreground location watching ─
  useEffect(() => {
    isMountedRef.current = true;

    const initLocation = async () => {
      try {
        // Request permission via unified manager
        const permResult = await requestForegroundLocation();
        if (permResult.status !== 'granted') {
          if (isMountedRef.current) {
            setErrorMsg('Location permission was denied');
          }
          return;
        }

        // Get initial position
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }).catch(() => null);

        if (loc && isMountedRef.current) {
          setLocation(loc);
          if (!lastLocationRef.current) lastLocationRef.current = loc;
        }

        // Start watching
        subscriptionRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          async (newLocation) => {
            if (!isMountedRef.current) return;

            setLocation(newLocation);
            
            if (rideId && lastLocationRef.current) {
              const dKm = getDistanceFromLatLonInKm(
                lastLocationRef.current.coords.latitude,
                lastLocationRef.current.coords.longitude,
                newLocation.coords.latitude,
                newLocation.coords.longitude
              );
              
              if (dKm > 0 && dKm < 2) {
                setCurrentDistance(prev => prev + dKm);
              }
            }
            
            lastLocationRef.current = newLocation;
            
            // Foreground sync to Supabase
            if (rideId && isMountedRef.current) {
              try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user && isMountedRef.current) {
                  await supabase.from('ride_points').insert({
                    ride_id: rideId,
                    user_id: user.id,
                    lat: newLocation.coords.latitude,
                    lng: newLocation.coords.longitude,
                    alt: newLocation.coords.altitude,
                    speed: newLocation.coords.speed,
                  });
                }
              } catch (authErr) {
                console.warn('[Location] Silent auth failure in location watch:', authErr);
              }
            }
          }
        );
      } catch (err) {
        console.error('[Location] Error initializing:', err);
        if (isMountedRef.current) {
          setErrorMsg('Failed to initialize location tracking');
        }
      }
    };

    initLocation();

    return () => {
      isMountedRef.current = false;
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
    };
  }, [rideId]);

  return { location, errorMsg, currentDistance };
}
