import { useEffect, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import { useLocation } from './useLocation';
import { useRiderLocations } from './useRiderLocations';
import { useProfile } from './useProfile';

interface RiderPosition {
    user_id: string;
    lat: number;
    lng: number;
}

const ALERT_RADIUS_KM = 5;

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

export function useProximityAlerts() {
    const { profile } = useProfile();
    const { location } = useLocation();
    const { riderLocations } = useRiderLocations();
    
    const alertedRiders = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!location?.coords || !riderLocations || riderLocations.length === 0 || !profile?.id) return;

        const myLat = location.coords.latitude;
        const myLng = location.coords.longitude;

        // Validate our own coordinates
        if (isNaN(myLat) || isNaN(myLng)) return;

        riderLocations.forEach((rider: RiderPosition) => {
            if (rider.user_id === profile.id) return;

            // Validate rider coordinates
            if (typeof rider.lat !== 'number' || typeof rider.lng !== 'number') return;
            if (isNaN(rider.lat) || isNaN(rider.lng)) return;

            const distance = getDistanceFromLatLonInKm(myLat, myLng, rider.lat, rider.lng);

            if (distance <= ALERT_RADIUS_KM && !alertedRiders.current.has(rider.user_id)) {
                alertedRiders.current.add(rider.user_id);
                
                Alert.alert(
                    'Rider Nearby! 🏍️',
                    `A fellow rider is within ${ALERT_RADIUS_KM}km of your location. Stay sharp and wave if you see them!`,
                    [{ text: 'Got it', style: 'default' }]
                );
            } else if (distance > ALERT_RADIUS_KM && alertedRiders.current.has(rider.user_id)) {
                alertedRiders.current.delete(rider.user_id);
            }
        });
    }, [location?.coords?.latitude, location?.coords?.longitude, riderLocations, profile?.id]);
}
