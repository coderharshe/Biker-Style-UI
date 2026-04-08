import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const LOCATION_TRACKING_TASK = 'BACKGROUND_LOCATION_TASK';

const OFFLINE_BUFFER_KEY = 'offline_ride_points';
const MAX_BUFFER_SIZE = 1000; // ~2.7 hours at 10s intervals

/**
 * Global task definition for background location updates.
 * This runs even when the app is backgrounded or killed.
 * 
 * CRITICAL: This must be exceptionally resilient — any unhandled
 * exception here kills the background task silently on Android.
 */
TaskManager.defineTask(LOCATION_TRACKING_TASK, async ({ data, error }: any) => {
    // Outer try/catch: NEVER let this task throw, or Android will kill it
    try {
        if (error) {
            console.error('[LocationTask] Background error:', error);
            return;
        }

        if (!data) return;

        const { locations } = data as { locations: Location.LocationObject[] };
        if (!locations || locations.length === 0) return;
        
        const location = locations[0];

        // Validate coordinates before proceeding
        if (
            typeof location?.coords?.latitude !== 'number' ||
            typeof location?.coords?.longitude !== 'number' ||
            isNaN(location.coords.latitude) ||
            isNaN(location.coords.longitude)
        ) {
            console.warn('[LocationTask] Invalid coordinates, skipping');
            return;
        }

        // 1. Get active ride ID from AsyncStorage
        const rideId = await AsyncStorage.getItem('active_ride_id').catch(() => null);
        if (!rideId) return;

        // 2. Get authenticated user (may fail if token expired)
        let userId: string | null = null;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            userId = user?.id ?? null;
        } catch {
            // Auth might fail in background — try session instead
            try {
                const { data: { session } } = await supabase.auth.getSession();
                userId = session?.user?.id ?? null;
            } catch {
                console.warn('[LocationTask] Auth unavailable in background');
                return;
            }
        }

        if (!userId) return;

        const newPoint = {
            ride_id: rideId,
            user_id: userId,
            lat: location.coords.latitude,
            lng: location.coords.longitude,
            alt: location.coords.altitude ?? null,
            speed: location.coords.speed ?? null,
            created_at: new Date(location.timestamp || Date.now()).toISOString(),
        };

        // 3. Try to sync to Supabase
        const { error: syncError } = await supabase.from('ride_points').insert(newPoint);

        if (syncError) {
            // Buffer locally on failure (offline, network issue, etc.)
            console.warn('[LocationTask] Sync failed, buffering locally:', syncError.message);
            await bufferPoint(newPoint);
        } else {
            // Success: flush any pending buffer
            await flushBuffer();
        }
    } catch (err) {
        // CRITICAL: Catch-all to prevent background task death
        console.error('[LocationTask] Unhandled error (task preserved):', err);
    }
});

/**
 * Add a point to the local offline buffer.
 */
async function bufferPoint(point: Record<string, any>): Promise<void> {
    try {
        const existing = await AsyncStorage.getItem(OFFLINE_BUFFER_KEY);
        const buffer: Record<string, any>[] = existing ? JSON.parse(existing) : [];
        buffer.push(point);

        // Keep buffer manageable
        while (buffer.length > MAX_BUFFER_SIZE) {
            buffer.shift();
        }

        await AsyncStorage.setItem(OFFLINE_BUFFER_KEY, JSON.stringify(buffer));
    } catch (err) {
        console.warn('[LocationTask] Buffer write failed:', err);
    }
}

/**
 * Flush the offline buffer to Supabase in batches.
 */
async function flushBuffer(): Promise<void> {
    try {
        const existing = await AsyncStorage.getItem(OFFLINE_BUFFER_KEY);
        if (!existing) return;

        const buffer: Record<string, any>[] = JSON.parse(existing);
        if (buffer.length === 0) return;

        console.log(`[LocationTask] Flushing ${buffer.length} buffered points...`);

        // Insert in batches of 50 to avoid payload limits
        const BATCH_SIZE = 50;
        let allFlushed = true;

        for (let i = 0; i < buffer.length; i += BATCH_SIZE) {
            const batch = buffer.slice(i, i + BATCH_SIZE);
            const { error } = await supabase.from('ride_points').insert(batch);
            if (error) {
                console.warn(`[LocationTask] Batch flush failed at index ${i}:`, error.message);
                allFlushed = false;
                // Keep remaining un-flushed points
                const remaining = buffer.slice(i);
                await AsyncStorage.setItem(OFFLINE_BUFFER_KEY, JSON.stringify(remaining));
                return;
            }
        }

        if (allFlushed) {
            await AsyncStorage.removeItem(OFFLINE_BUFFER_KEY);
            console.log('[LocationTask] Buffer flushed successfully');
        }
    } catch (err) {
        console.warn('[LocationTask] Buffer flush error:', err);
    }
}
