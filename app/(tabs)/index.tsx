import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
  FlatList,
  Dimensions,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import GlassCard from '@/components/GlassCard';
import SOSButton from '@/components/SOSButton';
import DestinationPicker, { Destination } from '@/components/DestinationPicker';
import { dashboardData, sosHelpers, currentUser } from '@/data/mockData';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from '@/components/MapLib';
import { mapStyle } from '@/components/CustomMapStyle';
import MapMarker from '@/components/MapMarker';

const { width: SCREEN_W } = Dimensions.get('window');

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Night Owl,';
  if (h < 12) return 'Good Morning,';
  if (h < 17) return 'Good Afternoon,';
  if (h < 21) return 'Good Evening,';
  return 'Night Owl,';
}

const RISK_COLORS = { Low: Colors.dark.success, Medium: Colors.dark.accent, High: Colors.dark.sos } as const;

function AnimatedCounter({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [display, setDisplay] = useState(0);
  const animVal = useSharedValue(0);

  useEffect(() => {
    animVal.value = withTiming(target, { duration: 1600, easing: Easing.out(Easing.cubic) });
    const interval = setInterval(() => {
      const progress = animVal.value / target;
      setDisplay(Math.round(animVal.value));
      if (progress >= 0.99) {
        setDisplay(target);
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [target]);

  return <Text style={styles.counterText}>{prefix}{display}{suffix}</Text>;
}

function FloatingChip({ icon, label, value, color, delay }: {
  icon: string; label: string; value: string | number; color: string; delay: number;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 600, easing: Easing.out(Easing.back(1.5)) }));
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

function ProgressRing({ percent, size, color, label }: { percent: number; size: number; color: string; label: string }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(percent / 100, { duration: 1400, easing: Easing.out(Easing.cubic) });
  }, [percent]);

  const fillStyle = useAnimatedStyle(() => {
    const angle = progress.value * 360;
    return {
      transform: [{ rotate: `${angle}deg` }],
    };
  });

  return (
    <View style={[styles.ringContainer, { width: size, height: size }]}>
      <View style={[styles.ringTrack, { width: size, height: size, borderRadius: size / 2, borderColor: color + '25' }]} />
      <View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
        <Animated.View style={[
          { position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 3, borderColor: 'transparent', borderTopColor: color, borderRightColor: color },
          fillStyle,
        ]} />
      </View>
      <View style={styles.ringCenter}>
        <Text style={[styles.ringPercent, { color }]}>{percent}</Text>
        <Text style={styles.ringLabel}>{label}</Text>
      </View>
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
  const d = dashboardData;
  const goalProgress = useSharedValue(0);

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

  useEffect(() => {
    goalProgress.value = withTiming(d.todayRideKM / d.goalKM, { duration: 1200, easing: Easing.out(Easing.cubic) });
  }, []);

  const goalBarStyle = useAnimatedStyle(() => ({
    width: `${goalProgress.value * 100}%`,
  }));

  const xpProgress = useSharedValue(0);
  useEffect(() => {
    xpProgress.value = withTiming(d.gamification.xp / d.gamification.nextLevelXP, { duration: 1400, easing: Easing.out(Easing.cubic) });
  }, []);

  const xpBarStyle = useAnimatedStyle(() => ({
    width: `${xpProgress.value * 100}%`,
  }));

  const tireProgress = useSharedValue(0);
  useEffect(() => {
    tireProgress.value = withTiming(d.analytics.tireHealth / 100, { duration: 1200, easing: Easing.out(Easing.cubic) });
  }, []);

  const tireBarStyle = useAnimatedStyle(() => ({
    width: `${tireProgress.value * 100}%`,
  }));

  const riskColor = RISK_COLORS[d.rideConditions.roadRisk];
  const statusColor = d.rideStatus === 'Active Ride' ? Colors.dark.success : d.rideStatus === 'Group Ride Active' ? Colors.dark.secondary : Colors.dark.textTertiary;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 16) + 8, paddingBottom: 130 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.greetingSection}>
          <View style={styles.greetingLeft}>
            <Text style={styles.greetingLabel}>{getGreeting()}</Text>
            <Text style={styles.greetingName}>{currentUser.name}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '18', borderColor: statusColor + '40' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{d.rideStatus}</Text>
          </View>
        </View>

        <View style={styles.goalRow}>
          <View style={styles.goalInfo}>
            <Text style={styles.goalKM}>{d.todayRideKM} <Text style={styles.goalUnit}>/ {d.goalKM} KM</Text></Text>
            <Text style={styles.goalLabel}>Today's Ride Goal</Text>
          </View>
          <Text style={styles.goalPercent}>{Math.round((d.todayRideKM / d.goalKM) * 100)}%</Text>
        </View>
        <View style={styles.goalTrack}>
          <Animated.View style={[styles.goalFill, goalBarStyle]}>
            <View style={styles.goalGlow} />
          </Animated.View>
        </View>

        <GlassCard>
          <View style={styles.condHeader}>
            <View style={styles.condLeft}>
              <View style={styles.condIconWrap}>
                <Feather name={d.rideConditions.icon as any} size={22} color={Colors.dark.warning} />
              </View>
              <View>
                <Text style={styles.condTemp}>{d.rideConditions.temp}°C</Text>
                <Text style={styles.condWeather}>{d.rideConditions.weather}</Text>
              </View>
            </View>
            <View style={styles.condRight}>
              <View style={styles.condStat}>
                <Feather name="wind" size={13} color={Colors.dark.textTertiary} />
                <Text style={styles.condVal}>{d.rideConditions.wind}</Text>
              </View>
              <View style={styles.condStat}>
                <Feather name="droplet" size={13} color={Colors.dark.textTertiary} />
                <Text style={styles.condVal}>{d.rideConditions.humidity}</Text>
              </View>
            </View>
          </View>
          <View style={styles.condDivider} />
          <View style={styles.condFooter}>
            <View style={styles.riskRow}>
              <Text style={styles.riskLabel}>Road Risk</Text>
              <View style={[styles.riskBadge, { backgroundColor: riskColor + '18', borderColor: riskColor + '40' }]}>
                <View style={[styles.riskDot, { backgroundColor: riskColor }]} />
                <Text style={[styles.riskText, { color: riskColor }]}>{d.rideConditions.roadRisk}</Text>
              </View>
            </View>
            <View style={styles.suggestedRow}>
              <Feather name="clock" size={12} color={Colors.dark.secondary} />
              <Text style={styles.suggestedText}>Best window: {d.rideConditions.suggestedTime}</Text>
            </View>
          </View>
        </GlassCard>

        <GlassCard style={{ padding: 0 }} noPadding>
          <View style={styles.mapContainer}>
            <View style={styles.mapPlaceholder}>
              <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                customMapStyle={mapStyle}
                initialRegion={{
                  latitude: 34.1642,
                  longitude: 77.5848,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
              >
                {d.mapData.riderPositions.map((pos: any, i: number) => (
                  <Marker
                    key={pos.id}
                    coordinate={{
                      latitude: 34.1642 + (pos.top - 50) * 0.001,
                      longitude: 77.5848 + (pos.left - 50) * 0.001
                    }}
                  >
                    <MapMarker position={pos} isUser={pos.isUser} isSOS={pos.isSOS} index={i} />
                  </Marker>
                ))}

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
                        { latitude: 34.1642, longitude: 77.5848 }, // Current user pos (mocked)
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
                <FloatingChip icon="users" label="Riders" value={d.mapData.nearbyRiders} color={Colors.dark.accent} delay={200} />
                <FloatingChip icon="alert-triangle" label="SOS" value={d.mapData.activeSOS} color={Colors.dark.sos} delay={400} />
                <FloatingChip icon="navigation" label="Rides" value={d.mapData.groupRidesActive} color={Colors.dark.secondary} delay={600} />
              </View>

              <Pressable
                style={styles.searchTrigger}
                onPress={() => setShowPicker(true)}
              >
                <Feather name="search" size={16} color={Colors.dark.accent} />
                <Text style={styles.searchText}>{selectedDestination ? selectedDestination.name : 'Where to?'}</Text>
              </Pressable>

              {selectedDestination && (
                <Pressable
                  style={styles.navButton}
                  onPress={handleStartNavigation}
                >
                  <Feather name="navigation" size={18} color="#000" />
                  <Text style={styles.navButtonText}>START</Text>
                </Pressable>
              )}

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
              mapRef.current?.animateToRegion({
                latitude: (34.1642 + dest.latitude) / 2,
                longitude: (77.5848 + dest.longitude) / 2,
                latitudeDelta: Math.abs(34.1642 - dest.latitude) * 2,
                longitudeDelta: Math.abs(77.5848 - dest.longitude) * 2,
              });
            }}
            onClose={() => setShowPicker(false)}
          />
        )}

        <View style={styles.sosSection}>
          <View style={styles.sosCenter}>
            <SOSButton onPress={() => router.push('/sos')} size={60} />
          </View>
          <View style={styles.sosStatsRow}>
            <View style={styles.sosStat}>
              <Feather name="clock" size={14} color={Colors.dark.sos} />
              <Text style={styles.sosStatLabel}>Avg Response</Text>
              <Text style={styles.sosStatVal}>{d.sosPanel.avgResponseTime}</Text>
            </View>
            <View style={styles.sosDivider} />
            <View style={styles.sosStat}>
              <Feather name="users" size={14} color={Colors.dark.success} />
              <Text style={styles.sosStatLabel}>Available Now</Text>
              <Text style={styles.sosStatVal}>{d.sosPanel.availableHelpers}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionLine} />
          <Text style={styles.sectionTitle}>RIDE ANALYTICS</Text>
          <View style={styles.sectionLine} />
        </View>

        <View style={styles.analyticsRow}>
          <GlassCard style={styles.analyticsCard}>
            <Feather name="trending-up" size={16} color={Colors.dark.secondary} />
            <Text style={styles.analyticsLabel}>This Week</Text>
            <AnimatedCounter target={d.analytics.weeklyKM} suffix=" km" />
            <Text style={styles.analyticsSub}>{d.analytics.rideHours} hrs</Text>
          </GlassCard>
          <GlassCard style={styles.analyticsCard}>
            <Feather name="shield" size={16} color={Colors.dark.success} />
            <Text style={styles.analyticsLabel}>Safety</Text>
            <AnimatedCounter target={d.analytics.safetyScore} suffix="/100" />
            <View style={styles.miniBar}>
              <View style={[styles.miniBarFill, { width: `${d.analytics.safetyScore}%`, backgroundColor: Colors.dark.success }]} />
            </View>
          </GlassCard>
        </View>

        <GlassCard>
          <View style={styles.bikeHeader}>
            <Feather name="settings" size={15} color={Colors.dark.accent} />
            <Text style={styles.bikeTitle}>Bike Health</Text>
          </View>
          <View style={styles.bikeRow}>
            <View style={styles.bikeStat}>
              <Text style={styles.bikeStatLabel}>Next Service</Text>
              <Text style={styles.bikeStatVal}>{d.analytics.serviceDueKM} km</Text>
            </View>
            <View style={styles.bikeStat}>
              <Text style={styles.bikeStatLabel}>Fuel Efficiency</Text>
              <Text style={styles.bikeStatVal}>{d.analytics.fuelEfficiency}</Text>
            </View>
          </View>
          <View style={styles.tireRow}>
            <Text style={styles.tireLabel}>Tire Health</Text>
            <Text style={styles.tirePercent}>{d.analytics.tireHealth}%</Text>
          </View>
          <View style={styles.tireTrack}>
            <Animated.View style={[styles.tireFill, tireBarStyle, {
              backgroundColor: d.analytics.tireHealth > 60 ? Colors.dark.success : d.analytics.tireHealth > 30 ? Colors.dark.accent : Colors.dark.sos
            }]} />
          </View>
        </GlassCard>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionLine} />
          <Text style={styles.sectionTitle}>MISSIONS</Text>
          <View style={styles.sectionLine} />
        </View>

        <GlassCard>
          <View style={styles.xpHeader}>
            <View style={styles.xpTitleRow}>
              <Feather name="zap" size={16} color={Colors.dark.accent} />
              <Text style={styles.xpTitle}>{d.gamification.levelTitle}</Text>
            </View>
            <Text style={styles.xpNumbers}>{d.gamification.xp} / {d.gamification.nextLevelXP} XP</Text>
          </View>
          <View style={styles.xpTrack}>
            <Animated.View style={[styles.xpFill, xpBarStyle]}>
              <View style={styles.xpGlow} />
            </Animated.View>
          </View>
          <View style={styles.missionsContainer}>
            {d.gamification.todayMissions.map((m, i) => (
              <View key={i} style={styles.missionRow}>
                <View style={[styles.missionIcon, { backgroundColor: m.done ? Colors.dark.success + '18' : Colors.dark.accentDim }]}>
                  <Feather name={m.done ? 'check' : m.icon as any} size={14} color={m.done ? Colors.dark.success : Colors.dark.accent} />
                </View>
                <View style={styles.missionInfo}>
                  <Text style={[styles.missionTitle, m.done && styles.missionDone]}>{m.title}</Text>
                  <Text style={styles.missionXP}>+{m.xp} XP</Text>
                </View>
                {m.done && <View style={styles.missionCheck}><Feather name="check-circle" size={16} color={Colors.dark.success} /></View>}
              </View>
            ))}
          </View>
        </GlassCard>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionLine} />
          <Text style={styles.sectionTitle}>COMMUNITY PULSE</Text>
          <View style={styles.sectionLine} />
        </View>

        <FlatList
          data={d.communityFeed}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.feedList}
          renderItem={({ item }) => <CommunityCard item={item} />}
          scrollEnabled={d.communityFeed.length > 0}
        />

      </ScrollView>

      <View style={styles.sosFloat}>
        <View style={styles.sosFloatInner} />
      </View>

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
    gap: 14,
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
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 9,
    color: Colors.dark.accent,
    letterSpacing: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },

  greetingSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  greetingLeft: {},
  greetingLabel: {
    fontFamily: 'Rajdhani_400Regular',
    fontSize: 14,
    color: Colors.dark.textSecondary,
    letterSpacing: 0.5,
  },
  greetingName: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 28,
    color: Colors.dark.text,
    letterSpacing: 1,
    marginTop: -2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    marginTop: 4,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  goalRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  goalInfo: {},
  goalKM: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 24,
    color: Colors.dark.accent,
  },
  goalUnit: {
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 14,
    color: Colors.dark.textTertiary,
  },
  goalLabel: {
    fontFamily: 'Rajdhani_400Regular',
    fontSize: 11,
    color: Colors.dark.textTertiary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: -2,
  },
  goalPercent: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 20,
    color: Colors.dark.accent,
  },
  goalTrack: {
    height: 6,
    backgroundColor: Colors.dark.accentDim,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: -4,
  },
  goalFill: {
    height: 6,
    backgroundColor: Colors.dark.accent,
    borderRadius: 3,
    overflow: 'hidden',
  },
  goalGlow: {
    position: 'absolute',
    right: 0,
    top: -1,
    bottom: -1,
    width: 16,
    backgroundColor: Colors.dark.accent,
    borderRadius: 3,
    shadowColor: Colors.dark.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },

  condHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  condLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  condIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.dark.warning + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  condTemp: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 24,
    color: Colors.dark.text,
  },
  condWeather: {
    fontFamily: 'Rajdhani_400Regular',
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: -3,
  },
  condRight: {
    gap: 6,
  },
  condStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  condVal: {
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  condDivider: {
    height: 1,
    backgroundColor: Colors.dark.glassBorder,
    marginVertical: 10,
  },
  condFooter: {
    gap: 6,
  },
  riskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  riskLabel: {
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
  },
  riskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  riskText: {
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  suggestedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  suggestedText: {
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 12,
    color: Colors.dark.secondary,
  },

  mapContainer: {
    height: 240,
    borderRadius: 16,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#0D1117',
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapGrid: {
    ...StyleSheet.absoluteFillObject,
  },
  mapGridLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  mapGridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  mapRoadMain: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '48%',
    width: 12,
    backgroundColor: '#2C3036',
    borderRadius: 6,
  },
  mapRoadSec: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: '#2C3036',
  },
  routeLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '49.5%',
    width: 4,
    backgroundColor: Colors.dark.accent,
    opacity: 0.8,
  },
  fullScreenBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(20,20,20,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  mapMarker: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
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
  markerPulseRing: {
    position: 'absolute',
    zIndex: 1,
  },
  chipRow: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    gap: 6,
  },
  floatingChip: {
    flex: 1,
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
  mapLabel: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(11,11,11,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.3)',
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
    color: Colors.dark.sos,
    letterSpacing: 2,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    pointerEvents: 'box-none',
  },
  searchTrigger: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(11,11,11,0.85)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchText: {
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  destMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(11,11,11,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.accent,
  },
  navButton: {
    position: 'absolute',
    bottom: 60,
    right: 12,
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: Colors.dark.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  navButtonText: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 14,
    color: '#000',
    letterSpacing: 1,
  },

  sosSection: {
    alignItems: 'center',
    gap: 14,
    paddingVertical: 4,
  },
  sosCenter: {
    alignItems: 'center',
  },
  sosStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.glassBorder,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 0,
    width: '100%',
  },
  sosStat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  sosStatLabel: {
    fontFamily: 'Rajdhani_400Regular',
    fontSize: 10,
    color: Colors.dark.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sosStatVal: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 18,
    color: Colors.dark.text,
  },
  sosDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.dark.glassBorder,
    marginHorizontal: 12,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.dark.glassBorder,
  },
  sectionTitle: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 11,
    color: Colors.dark.textTertiary,
    letterSpacing: 3,
  },

  analyticsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  analyticsCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  analyticsLabel: {
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 11,
    color: Colors.dark.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  counterText: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 22,
    color: Colors.dark.text,
  },
  analyticsSub: {
    fontFamily: 'Rajdhani_400Regular',
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  miniBar: {
    width: '80%',
    height: 4,
    backgroundColor: Colors.dark.glassBorder,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 2,
  },
  miniBarFill: {
    height: 4,
    borderRadius: 2,
  },

  bikeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  bikeTitle: {
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 14,
    color: Colors.dark.text,
    letterSpacing: 0.5,
  },
  bikeRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  bikeStat: {
    flex: 1,
  },
  bikeStatLabel: {
    fontFamily: 'Rajdhani_400Regular',
    fontSize: 11,
    color: Colors.dark.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bikeStatVal: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 18,
    color: Colors.dark.text,
    marginTop: -1,
  },
  tireRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tireLabel: {
    fontFamily: 'Rajdhani_400Regular',
    fontSize: 11,
    color: Colors.dark.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tirePercent: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 14,
    color: Colors.dark.text,
  },
  tireTrack: {
    height: 5,
    backgroundColor: Colors.dark.glassBorder,
    borderRadius: 3,
    overflow: 'hidden',
  },
  tireFill: {
    height: 5,
    borderRadius: 3,
  },

  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  xpTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  xpTitle: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 14,
    color: Colors.dark.accent,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  xpNumbers: {
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  xpTrack: {
    height: 7,
    backgroundColor: Colors.dark.accentDim,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
  },
  xpFill: {
    height: 7,
    backgroundColor: Colors.dark.accent,
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpGlow: {
    position: 'absolute',
    right: 0,
    top: -1,
    bottom: -1,
    width: 14,
    backgroundColor: Colors.dark.accent,
    borderRadius: 4,
    shadowColor: Colors.dark.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  missionsContainer: {
    gap: 8,
  },
  missionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.dark.glass,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.dark.glassBorder,
  },
  missionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionInfo: {
    flex: 1,
  },
  missionTitle: {
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 13,
    color: Colors.dark.text,
  },
  missionDone: {
    color: Colors.dark.textTertiary,
    textDecorationLine: 'line-through',
  },
  missionXP: {
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 11,
    color: Colors.dark.accent,
  },
  missionCheck: {},

  feedList: {
    paddingRight: 16,
    gap: 10,
  },
  feedCard: {
    width: 180,
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  feedIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedText: {
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 13,
    color: Colors.dark.text,
    lineHeight: 17,
  },
  feedTime: {
    fontFamily: 'Rajdhani_400Regular',
    fontSize: 10,
    color: Colors.dark.textTertiary,
  },

  sosFloat: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 0,
  },
  sosFloatInner: {},

  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringTrack: {
    position: 'absolute',
    borderWidth: 3,
  },
  ringCenter: {
    alignItems: 'center',
  },
  ringPercent: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 18,
  },
  ringLabel: {
    fontFamily: 'Rajdhani_400Regular',
    fontSize: 9,
    color: Colors.dark.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
