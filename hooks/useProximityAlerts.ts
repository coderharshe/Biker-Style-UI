import { useEffect, useRef } from 'react';
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

// Haversine formula to calculate the distance between two lat/lng points
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}

export function useProximityAlerts() {
    const { profile } = useProfile();
    const { location } = useLocation();
    const { riderLocations } = useRiderLocations();
    
    // Keep track of who we've already alerted about to avoid spamming alerts
    const alertedRiders = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!location || !riderLocations || riderLocations.length === 0 || !profile?.id) return;

        const myLat = location.coords.latitude;
        const myLng = location.coords.longitude;

        riderLocations.forEach((rider: RiderPosition) => {
            if (rider.user_id === profile.id) return; // Skip self

            const distance = getDistanceFromLatLonInKm(myLat, myLng, rider.lat, rider.lng);

            if (distance <= ALERT_RADIUS_KM && !alertedRiders.current.has(rider.user_id)) {
                alertedRiders.current.add(rider.user_id);
                
                // Trigger a local UI alert for the nearby rider
                Alert.alert(
                    'Rider Nearby! 🏍️',
                    `A fellow rider is within ${ALERT_RADIUS_KM}km of your location. Stay sharp and wave if you see them!`,
                    [{ text: 'Got it', style: 'default' }]
                );
            } else if (distance > ALERT_RADIUS_KM && alertedRiders.current.has(rider.user_id)) {
                // If they leave the radius, remove them from the alerted set so they can trigger it again later
                alertedRiders.current.delete(rider.user_id);
            }
        });
    }, [location, riderLocations, profile]);
}
