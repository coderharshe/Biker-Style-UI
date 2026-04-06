import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
  FlatList,
  Dimensions,
  Linking,
  Text,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import GlassCard from '@/components/GlassCard';
import SOSButton from '@/components/SOSButton';
import DestinationPicker, { Destination } from '@/components/DestinationPicker';
import { dashboardData } from '@/data/mockData';
import { useProfile } from '@/hooks/useProfile';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from '@/components/MapLib';
import { mapStyle } from '@/components/CustomMapStyle';
import MapMarker from '@/components/MapMarker';
import { useLocation } from '@/hooks/useLocation';
import { useRiderLocations } from '@/hooks/useRiderLocations';
import { useSOS } from '@/hooks/useSOS';
import { useProximityAlerts } from '@/hooks/useProximityAlerts';
import { useRide } from '@/hooks/useRide';
import Constants from 'expo-constants';

// Modular Dashboard Components
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import GoalTracker from '@/components/dashboard/GoalTracker';
import RideConditionCard from '@/components/dashboard/RideConditionCard';
import BikeHealthCard from '@/components/dashboard/BikeHealthCard';
import MissionTracker from '@/components/dashboard/MissionTracker';

const { width: SCREEN_W } = Dimensions.get('window');

function FloatingChip({ icon, label, value, color }: {
  icon: string; label: string; value: string | number; color: string;
}) {
  return (
    <View style={styles.floatingChip}>
      <View style={[styles.chipDot, { backgroundColor: color }]} />
      <Text style={styles.chipValue}>{value}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

function CommunityCard({ item }: { item: typeof dashboardData.communityFeed[0] }) {
  return (
    <View style={[styles.feedCard, { borderColor: item.color + '30' }]}>
      <View style={[styles.feedIconWrap, { backgroundColor: item.color + '18' }]}>
        <Feather name={item.icon as any} size={16} color={item.color} />
      </View>
      <Text style={styles.feedText} numberOfLines={2}>{item.text}</Text>
      <Text style={styles.feedTime}>{item.time}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const { activeRideId, startRide, endRide, loading: rideLoading } = useRide();
  const { location, currentDistance } = useLocation(activeRideId); 
  const { riderLocations } = useRiderLocations(); 
  const { activeSOS } = useSOS(); 
  useProximityAlerts(); 
  
  const d = dashboardData;
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const mapRef = useRef<any>(null);

  const handleStartNavigation = () => {
    if (!selectedDestination) return;
    const url = Platform.select({
      ios: `maps://app?daddr=${selectedDestination.latitude},${selectedDestination.longitude}`,
      android: `google.navigation:q=${selectedDestination.latitude},${selectedDestination.longitude}`,
      web: `https://www.google.com/maps/dir/?api=1&destination=${selectedDestination.latitude},${selectedDestination.longitude}`
    });
    if (url) Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll, 
          { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 16) + 8, paddingBottom: 130 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <DashboardHeader 
          name={profile?.username || 'Rider'} 
          rideStatus={activeRideId ? 'Active Ride' : 'Ready to Ride'} 
        />

        <GoalTracker 
          currentKm={currentDistance > 0 ? parseFloat(currentDistance.toFixed(1)) : 0} 
          goalKm={d.goalKM} 
        />

        <RideConditionCard conditions={d.rideConditions} />

        <GlassCard style={{ padding: 0 }} noPadding>
          <View style={styles.mapContainer}>
            <View style={styles.mapPlaceholder}>
              <MapView
                provider={
                  Platform.OS === 'android' &&
                  Constants.expoConfig?.android?.config?.googleMaps?.apiKey &&
                  Constants.expoConfig.android.config.googleMaps.apiKey !== 'YOUR_ANDROID_API_KEY_HERE'
                    ? PROVIDER_GOOGLE
                    : undefined
                }
                style={styles.map}
                customMapStyle={Platform.OS === 'android' ? mapStyle : undefined}
                initialRegion={{
                  latitude: location?.coords.latitude || 34.1642,
                  longitude: location?.coords.longitude || 77.5848,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
                ref={mapRef}
              >
                {/* Rider Markers */}
                {riderLocations.map((pos, i) => (
                  <Marker
                    key={pos.user_id}
                    coordinate={{
                      latitude: pos.lat,
                      longitude: pos.lng
                    }}
                  >
                    <MapMarker position={pos} isUser={pos.user_id === profile?.id} isSOS={false} index={i} />
                  </Marker>
                ))}

                {/* SOS Markers */}
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

                {/* User Marker */}
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

                {selectedDestination && (
                  <>
                    <Marker
                      coordinate={{ latitude: selectedDestination.latitude, longitude: selectedDestination.longitude }}
                      title={selectedDestination.name}
                    >
                      <View style={styles.destMarker}>
                        <Feather name="map-pin" size={20} color={Colors.dark.accent} />
                      </View>
                    </Marker>
                    <Polyline
                      coordinates={[
                         { latitude: location?.coords.latitude || 34.1642, longitude: location?.coords.longitude || 77.5848 },
                         { latitude: selectedDestination.latitude, longitude: selectedDestination.longitude }
                      ]}
                      strokeColor={Colors.dark.accent}
                      strokeWidth={3}
                      lineDashPattern={[5, 5]}
                    />
                  </>
                )}
              </MapView>

              <View style={styles.chipRow}>
                <FloatingChip icon="users" label="Riders" value={d.mapData.nearbyRiders} color={Colors.dark.accent} />
                <FloatingChip icon="alert-triangle" label="SOS" value={d.mapData.activeSOS} color={Colors.dark.sos} />
                <FloatingChip icon="navigation" label="Rides" value={d.mapData.groupRidesActive} color={Colors.dark.secondary} />
              </View>

              <View style={styles.mapActionRow}>
                {!activeRideId ? (
                  <Pressable
                    style={[styles.navButton, { backgroundColor: Colors.dark.success, opacity: rideLoading ? 0.5 : 1 }]}
                    onPress={() => startRide()}
                    disabled={rideLoading}
                  >
                    <Feather name="play-circle" size={18} color="#000" />
                    <Text style={styles.navButtonText}>START RIDE</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={[styles.navButton, { backgroundColor: Colors.dark.sos, opacity: rideLoading ? 0.5 : 1 }]}
                    onPress={() => endRide(currentDistance)}
                    disabled={rideLoading}
                  >
                    <Feather name="stop-circle" size={18} color="#fff" />
                    <Text style={[styles.navButtonText, { color: '#fff' }]}>STOP {currentDistance.toFixed(1)} KM</Text>
                  </Pressable>
                )}
              </View>

              <View style={styles.mapLabel}>
                <View style={styles.mapLabelLive} />
                <Text style={styles.mapLabelText}>LIVE</Text>
              </View>

              <Pressable
                style={({ pressed }) => [styles.fullScreenBtn, pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] }]}
                onPress={() => router.push('/map')}
              >
                <Feather name="maximize-2" size={16} color={Colors.dark.text} />
              </Pressable>
            </View>
          </View>
        </GlassCard>

        {showPicker && (
          <DestinationPicker
            onSelect={(dest) => {
              setSelectedDestination(dest);
              setShowPicker(false);
            }}
            onClose={() => setShowPicker(false)}
          />
        )}

        <View style={styles.sosSection}>
          <SOSButton onPress={() => router.push('/sos')} size={64} />
          <View style={styles.sosStatsRow}>
            <View style={styles.sosStat}>
              <Feather name="clock" size={14} color={Colors.dark.sos} />
              <Text style={styles.sosStatVal}>{d.sosPanel.avgResponseTime}</Text>
              <Text style={styles.sosStatLabel}>Avg Response</Text>
            </View>
            <View style={styles.sosDivider} />
            <View style={styles.sosStat}>
              <Feather name="users" size={14} color={Colors.dark.success} />
              <Text style={styles.sosStatVal}>{d.sosPanel.availableHelpers}</Text>
              <Text style={styles.sosStatLabel}>Available Now</Text>
            </View>
          </View>
        </View>

        <BikeHealthCard analytics={d.analytics} />

        <MissionTracker 
          xp={profile?.xp || 0} 
          nextLevelXP={d.gamification.nextLevelXP} 
          levelTitle={d.gamification.levelTitle} 
          missions={d.gamification.todayMissions} 
        />

        <View style={styles.sectionHeader}>
           <Text style={styles.sectionTitle}>COMMUNITY PULSE</Text>
        </View>

        <FlatList
          data={d.communityFeed}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.feedList}
          renderItem={({ item }) => <CommunityCard item={item} />}
        />

      </ScrollView>

      {/* Side Button for Groups */}
      <View style={styles.sideActions}>
        <Pressable
          style={({ pressed }) => [
            styles.sideBtn,
            pressed && { transform: [{ scale: 0.95 }] }
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/groups');
          }}
        >
          <Feather name="users" size={20} color="#000" />
        </Pressable>
        <Text style={styles.sideBtnLabel}>GROUPS</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scroll: {
    paddingHorizontal: 16,
    gap: 16,
  },
  sideActions: {
    position: 'absolute',
    right: 0,
    top: '35%',
    alignItems: 'center',
    gap: 4,
    zIndex: 100,
  },
  sideBtn: {
    width: 48,
    height: 48,
    backgroundColor: Colors.dark.accent,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.dark.accent,
    shadowOffset: { width: -2, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
  sideBtnLabel: {
    ...Typography.label,
    fontSize: 9,
    color: Colors.dark.accent,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mapContainer: {
    height: 260,
    borderRadius: 16,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  chipRow: {
    flexDirection: 'row',
    position: 'absolute',
    top: 12,
    left: 12,
    gap: 8,
  },
  floatingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipValue: {
    ...Typography.h3,
    fontSize: 14,
    color: '#FFF',
  },
  chipLabel: {
    ...Typography.caption,
    fontSize: 9,
    color: 'rgba(255,255,255,0.6)',
  },
  mapActionRow: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  navButtonText: {
    ...Typography.h3,
    fontSize: 14,
    letterSpacing: 2,
  },
  mapLabel: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 6,
  },
  mapLabelLive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.dark.sos,
  },
  mapLabelText: {
    ...Typography.label,
    fontSize: 9,
    color: '#FFF',
  },
  fullScreenBtn: {
    position: 'absolute',
    bottom: 74,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(255, 59, 48, 0.05)',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.1)',
  },
  sosStatsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  sosStat: {
    alignItems: 'center',
    gap: 2,
  },
  sosStatVal: {
    ...Typography.h3,
    fontSize: 16,
    color: '#FFF',
  },
  sosStatLabel: {
    ...Typography.caption,
    fontSize: 9,
    color: Colors.dark.textSecondary,
  },
  sosDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  sectionHeader: {
    marginTop: 8,
  },
  sectionTitle: {
    ...Typography.caption,
    color: Colors.dark.textTertiary,
    letterSpacing: 2,
  },
  feedList: {
    paddingBottom: 20,
    gap: 12,
  },
  feedCard: {
    width: 180,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    gap: 8,
  },
  feedIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedText: {
    ...Typography.body,
    fontSize: 12,
    color: '#FFF',
    lineHeight: 18,
  },
  feedTime: {
    ...Typography.caption,
    fontSize: 9,
    color: Colors.dark.textTertiary,
  },
  destMarker: {
    backgroundColor: Colors.dark.background,
    padding: 4,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.dark.accent,
  }
});
