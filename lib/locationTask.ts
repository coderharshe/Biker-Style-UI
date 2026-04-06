import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const LOCATION_TRACKING_TASK = 'BACKGROUND_LOCATION_TASK';

const OFFLINE_BUFFER_KEY = 'offline_ride_points';

/**
 * Global task definition for background location updates.
 * This runs even when the app is backgrounded or killed.
 */
TaskManager.defineTask(LOCATION_TRACKING_TASK, async ({ data, error }: any) => {
    if (error) {
        console.error('Background Location Task Error:', error);
        return;
    }

    if (data) {
        const { locations } = data as { locations: Location.LocationObject[] };
        if (!locations || locations.length === 0) return;
        
        const location = locations[0];

        try {
            // 1. Get active ride ID from AsyncStorage (set by useLocation)
            const rideId = await AsyncStorage.getItem('active_ride_id');
            if (!rideId) return;

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const newPoint = {
                ride_id: rideId,
                user_id: user.id,
                lat: location.coords.latitude,
                lng: location.coords.longitude,
                alt: location.coords.altitude,
                speed: location.coords.speed,
                created_at: new Date(location.timestamp).toISOString(),
            };

            // 2. Try to sync to Supabase
            const { error: syncError } = await supabase.from('ride_points').insert(newPoint);

            if (syncError) {
                console.log('Offline: Buffering location point localy');
                // 3. Fallback: Buffer locally if sync fails (e.g. offline)
                const existing = await AsyncStorage.getItem(OFFLINE_BUFFER_KEY);
                const buffer = existing ? JSON.parse(existing) : [];
                buffer.push(newPoint);
                // Keep buffer manageable (last 1000 points ~ 2.7 hours at 10s intervals)
                if (buffer.length > 1000) buffer.shift();
                await AsyncStorage.setItem(OFFLINE_BUFFER_KEY, JSON.stringify(buffer));
            } else {
                // 4. Recovery: Flush existing buffer if successful
                const existing = await AsyncStorage.getItem(OFFLINE_BUFFER_KEY);
                if (existing) {
                    const buffer = JSON.parse(existing);
                    if (buffer.length > 0) {
                        console.log(`Syncing ${buffer.length} buffered points...`);
                        const { error: flushError } = await supabase.from('ride_points').insert(buffer);
                        if (!flushError) {
                            await AsyncStorage.removeItem(OFFLINE_BUFFER_KEY);
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Error in location task:', err);
        }
    }
});
