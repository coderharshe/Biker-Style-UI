import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Platform,
    Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withDelay,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useLocation } from '@/hooks/useLocation';
import { useRiderLocations } from '@/hooks/useRiderLocations';
import { useSOS } from '@/hooks/useSOS';
import { useProfile } from '@/hooks/useProfile';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from '@/components/MapLib';
import { mapStyle } from '@/components/CustomMapStyle';
import MapMarker from '@/components/MapMarker';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

function FloatingChip({
    icon,
    label,
    value,
    color,
    delay,
}: {
    icon: string;
    label: string;
    value: string | number;
    color: string;
    delay: number;
}) {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(8);

    useEffect(() => {
        opacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
        translateY.value = withDelay(
            delay,
            withTiming(0, { duration: 600, easing: Easing.out(Easing.back(1.5)) })
        );
    }, []);

    const animStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
    }));

    return (
        <Animated.View style={[styles.floatingChip, animStyle]}>
            <View style={[styles.chipDot, { backgroundColor: color }]} />
            <Text style={styles.chipValue}>{value}</Text>
            <Text style={styles.chipLabel}>{label}</Text>
        </Animated.View>
    );
}

import { fetchRouteLines, RoutePoint } from '@/lib/directions';
import Constants from 'expo-constants';

export default function MapScreen() {
    const insets = useSafeAreaInsets();
    const { profile } = useProfile();
    const { location } = useLocation();
    const { riderLocations } = useRiderLocations();
    const { activeSOS } = useSOS();
    
    const [routeCoords, setRouteCoords] = useState<RoutePoint[]>([]);

    useEffect(() => {
        if (location) {
            // Destination (In production, this would be dynamic via group info)
            const destination = { latitude: 34.1842, longitude: 77.6048 };
            
            // On Android, we prefer the config key. On Web/iOS fallback is OSRM.
            const apiKey = Constants.expoConfig?.android?.config?.googleMaps?.apiKey;
            const finalKey = apiKey === 'YOUR_ANDROID_API_KEY_HERE' ? undefined : apiKey;
            
            fetchRouteLines(
                { latitude: location.coords.latitude, longitude: location.coords.longitude },
                destination,
                finalKey
            ).then(setRouteCoords);
        }
    }, [location?.coords.latitude, location?.coords.longitude]);

    // For iOS, we default to Apple Maps if no Google key is provided to avoid crashes/blank maps.
    // For Android, Google Maps is the default and still requires a key in app.json to show tiles.
    const mapProvider = Platform.OS === 'ios' ? undefined : PROVIDER_GOOGLE;

    return (
        <View style={styles.container}>
            <View style={styles.mapContainer}>
                <MapView
                    provider={mapProvider}
                    style={styles.map}
                    customMapStyle={Platform.OS === 'android' ? mapStyle : undefined}
                    initialRegion={{
                        latitude: location?.coords.latitude || 34.1642,
                        longitude: location?.coords.longitude || 77.5848,
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05,
                    }}
                    showsUserLocation={true}
                    showsMyLocationButton={false}
                    zoomEnabled={true}
                    rotateEnabled={true}
                    pitchEnabled={true}
                >
                    {routeCoords.length > 0 && (
                        <Polyline
                            coordinates={routeCoords}
                            strokeColor={Colors.dark.accent}
                            strokeWidth={6}
                        />
                    )}

                    {riderLocations.map((pos, i) => (
                        <Marker
                            key={pos.user_id}
                            coordinate={{
                                latitude: pos.lat,
                                longitude: pos.lng,
                            }}
                        >
                            <MapMarker position={pos} isUser={pos.user_id === profile?.id} isSOS={false} index={i} />
                        </Marker>
                    ))}

                    {activeSOS.map((sos, i) => (
                        <Marker
                            key={`sos-${sos.id}`}
                            coordinate={{
                                latitude: sos.lat,
                                longitude: sos.lng
                            }}
                        >
                            <MapMarker position={{ lat: sos.lat, lng: sos.lng }} isUser={false} isSOS={true} index={i} />
                        </Marker>
                    ))}

                    {location && (
                        <Marker
                            coordinate={{
                                latitude: location.coords.latitude,
                                longitude: location.coords.longitude
                            }}
                        >
                            <MapMarker position={{ lat: location.coords.latitude, lng: location.coords.longitude }} isUser={true} isSOS={false} index={-1} />
                        </Marker>
                    )}
                </MapView>

                {/* Top Bar */}
                <View
                    style={[
                        styles.topBar,
                        { paddingTop: insets.top + (Platform.OS === 'web' ? 20 : 10) },
                    ]}
                >
                    <Pressable
                        onPress={() => router.back()}
                        style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
                    >
                        <Feather name="arrow-left" size={24} color={Colors.dark.text} />
                    </Pressable>
                    <View style={styles.routeInfo}>
                        <Text style={styles.routeTitle}>Group Ride: Canyon Run</Text>
                        <Text style={styles.routeSub}>Next turn in 2.5 km</Text>
                    </View>
                    <View style={styles.compassBtn}>
                        <Feather name="compass" size={20} color={Colors.dark.accent} />
                    </View>
                </View>

                {/* Bottom Controls */}
                <View
                    style={[
                        styles.bottomControls,
                        { paddingBottom: insets.bottom + 20 },
                    ]}
                >
                    <View style={styles.chipRow}>
                        <FloatingChip
                            icon="users"
                            label="Riders"
                            value={riderLocations.length}
                            color={Colors.dark.accent}
                            delay={200}
                        />
                        <FloatingChip
                            icon="alert-triangle"
                            label="SOS"
                            value={activeSOS.length}
                            color={Colors.dark.sos}
                            delay={400}
                        />
                    </View>

                    <View style={styles.navPanel}>
                        <View style={styles.navIcon}>
                            <Feather name="navigation" size={24} color="#FFF" />
                        </View>
                        <View style={styles.navTextCol}>
                            <Text style={styles.navTime}>45 min</Text>
                            <Text style={styles.navDist}>32 km remaining</Text>
                        </View>
                        <Pressable
                            style={({ pressed }) => [styles.endBtn, pressed && styles.pressed]}
                            onPress={() => router.back()}
                        >
                            <Text style={styles.endBtnText}>EXIT</Text>
                        </Pressable>
                    </View>
                </View>

                <View style={styles.mapLabel}>
                    <View style={styles.mapLabelLive} />
                    <Text style={styles.mapLabelText}>LIVE NAVIGATION</Text>
                </View>

            </View>
        </View>

    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1F2228', // Dark Google Maps grey
    },
    mapContainer: {
        flex: 1,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    markerDot: {
        borderWidth: 2,
        borderColor: '#0D1117',
        zIndex: 2,
    },
    markerGlow: {
        shadowColor: Colors.dark.secondary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 8,
        elevation: 6,
    },
    markerSOSGlow: {
        shadowColor: Colors.dark.sos,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 8,
        elevation: 6,
    },
    topBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
        zIndex: 10,
        backgroundColor: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)', // Web constraint, but let's try standard View for RN
    },
    backBtn: {
        width: 40,
        height: 40,
        backgroundColor: 'rgba(20,20,20,0.8)',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    routeInfo: {
        flex: 1,
        marginLeft: 12,
        backgroundColor: 'rgba(20,20,20,0.9)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    routeTitle: {
        fontFamily: 'Rajdhani_700Bold',
        fontSize: 16,
        color: Colors.dark.text,
    },
    routeSub: {
        fontFamily: 'Rajdhani_500Medium',
        fontSize: 12,
        color: Colors.dark.textSecondary,
    },
    compassBtn: {
        width: 40,
        height: 40,
        backgroundColor: 'rgba(20,20,20,0.8)',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    bottomControls: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        gap: 12,
    },
    chipRow: {
        flexDirection: 'row',
        gap: 8,
        alignSelf: 'flex-start',
    },
    floatingChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(11,11,11,0.85)',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    chipDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    chipValue: {
        fontFamily: 'Rajdhani_700Bold',
        fontSize: 13,
        color: Colors.dark.text,
    },
    chipLabel: {
        fontFamily: 'Rajdhani_400Regular',
        fontSize: 10,
        color: Colors.dark.textTertiary,
    },
    navPanel: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1F2228',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    navIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: Colors.dark.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    navTextCol: {
        flex: 1,
    },
    navTime: {
        fontFamily: 'Rajdhani_700Bold',
        fontSize: 24,
        color: Colors.dark.text,
        lineHeight: 28,
    },
    navDist: {
        fontFamily: 'Rajdhani_500Medium',
        fontSize: 14,
        color: Colors.dark.textSecondary,
    },
    endBtn: {
        backgroundColor: 'rgba(255,59,48,0.15)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,59,48,0.3)',
    },
    endBtnText: {
        fontFamily: 'Rajdhani_700Bold',
        fontSize: 14,
        color: Colors.dark.sos,
        letterSpacing: 1,
    },
    pressed: {
        opacity: 0.8,
        transform: [{ scale: 0.96 }],
    },
    mapLabel: {
        position: 'absolute',
        top: '50%',
        left: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    mapLabelLive: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.dark.sos,
    },
    mapLabelText: {
        fontFamily: 'Rajdhani_700Bold',
        fontSize: 10,
        color: Colors.dark.text,
        letterSpacing: 1,
    },
});
