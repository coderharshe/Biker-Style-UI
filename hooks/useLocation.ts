import { useEffect, useState, useRef } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

// Helper: Calculate distance between two coordinates in km using Haversine formula
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

import { LOCATION_TRACKING_TASK } from '@/lib/locationTask';

export function useLocation(rideId?: string | null) {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentDistance, setCurrentDistance] = useState(0);

  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const lastLocationRef = useRef<Location.LocationObject | null>(null);
  const previousRideIdRef = useRef<string | null | undefined>(undefined);

  // Background Task Management
  const startBackgroundTracking = async () => {
    if (Platform.OS === 'web') return;
    
    // Store for background task to pick up
    if (rideId) {
      await AsyncStorage.setItem('active_ride_id', rideId);
    }
    
    const isRegistered = await Location.hasStartedLocationUpdatesAsync(LOCATION_TRACKING_TASK);
    if (!isRegistered) {
      await Location.startLocationUpdatesAsync(LOCATION_TRACKING_TASK, {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 10000, // 10 seconds to save battery in background
        distanceInterval: 10,
        foregroundService: {
          notificationTitle: 'Motosphere Tracking',
          notificationBody: 'Tracking your ride in the background...',
          notificationColor: '#FF6B2C', // Brand color
        },
        pausesUpdatesAutomatically: false,
      });
    }
  };

  const stopBackgroundTracking = async () => {
    if (Platform.OS === 'web') return;
    await AsyncStorage.removeItem('active_ride_id');
    const isRegistered = await Location.hasStartedLocationUpdatesAsync(LOCATION_TRACKING_TASK);
    if (isRegistered) {
      await Location.stopLocationUpdatesAsync(LOCATION_TRACKING_TASK);
    }
  };

  useEffect(() => {
    if (rideId && rideId !== previousRideIdRef.current) {
        setCurrentDistance(0);
        lastLocationRef.current = location;
        startBackgroundTracking(); 
    } else if (!rideId && previousRideIdRef.current) {
        stopBackgroundTracking();
    }
    previousRideIdRef.current = rideId;
  }, [rideId]);

  useEffect(() => {
    (async () => {
      try {
          // Foreground permissions
          let { status: fgStatus } = await Location.getForegroundPermissionsAsync();
          if (fgStatus !== 'granted') {
              const { status: reqStatus } = await Location.requestForegroundPermissionsAsync();
              fgStatus = reqStatus;
          }
          
          if (fgStatus !== 'granted') {
            setErrorMsg('Permission to access location was denied');
            return;
          }

          // Removed automatic Background permissions request. 
          // Android 11+ prohibits auto-requesting background permissions without explicitly bringing the user to settings.
          // The Foreground service handles our tracking while the app is active, and background 
          // permission is strictly handled separatedly or naturally via the service notification if needed.

          const loc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced
          }).catch(() => null);
          
          if (loc) {
            setLocation(loc);
            if (!lastLocationRef.current) lastLocationRef.current = loc;
          }

      // Start watching location (Foreground)
      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        async (newLocation) => {
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
          
          // Foreground sync to Supabase (Background task handles the rest)
          if (rideId) {
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
    } catch (err) {
      console.error('Error initializing location:', err);
      setErrorMsg('Failed to initialize location tracking');
    }
    })();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
      }
    };
  }, [rideId]);

  return { location, errorMsg, currentDistance };
}
