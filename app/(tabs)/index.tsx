import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import GlassCard from '@/components/GlassCard';
import XPBar from '@/components/XPBar';
import SOSButton from '@/components/SOSButton';
import StatCard from '@/components/StatCard';
import Avatar from '@/components/Avatar';
import { currentUser, weatherData, riders } from '@/data/mockData';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const nearbyCount = 7;
  const activeRides = 3;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 16) + 8, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.greetingRow}>
          <View style={styles.greetingLeft}>
            <Text style={styles.greeting}>Ride on,</Text>
            <Text style={styles.userName}>{currentUser.name}</Text>
          </View>
          <Avatar initials={currentUser.avatar} size={46} color={Colors.dark.accent} />
        </View>

        <GlassCard>
          <View style={styles.weatherRow}>
            <View style={styles.weatherLeft}>
              <Feather name={weatherData.icon as any} size={28} color={Colors.dark.warning} />
              <View>
                <Text style={styles.weatherTemp}>{weatherData.temp}°C</Text>
                <Text style={styles.weatherCond}>{weatherData.condition}</Text>
              </View>
            </View>
            <View style={styles.weatherRight}>
              <View style={styles.weatherStat}>
                <Feather name="wind" size={14} color={Colors.dark.textTertiary} />
                <Text style={styles.weatherVal}>{weatherData.wind}</Text>
              </View>
              <View style={styles.weatherStat}>
                <Feather name="droplet" size={14} color={Colors.dark.textTertiary} />
                <Text style={styles.weatherVal}>{weatherData.humidity}</Text>
              </View>
            </View>
          </View>
          <Text style={styles.weatherNote}>Perfect riding conditions</Text>
        </GlassCard>

        <GlassCard style={{ padding: 0 }} noPadding>
          <View style={styles.mapContainer}>
            <View style={styles.mapPlaceholder}>
              <View style={styles.mapGrid}>
                {[...Array(20)].map((_, i) => (
                  <View key={i} style={[styles.mapGridLine, { left: `${(i + 1) * 5}%` }]} />
                ))}
                {[...Array(12)].map((_, i) => (
                  <View key={i} style={[styles.mapGridLineH, { top: `${(i + 1) * 8}%` }]} />
                ))}
              </View>
              <View style={[styles.mapMarker, { top: '30%', left: '45%' }]}>
                <View style={styles.markerDot} />
                <View style={styles.markerPulse} />
              </View>
              <View style={[styles.mapMarker, { top: '50%', left: '65%' }]}>
                <View style={[styles.markerDot, { backgroundColor: Colors.dark.secondary }]} />
              </View>
              <View style={[styles.mapMarker, { top: '40%', left: '25%' }]}>
                <View style={[styles.markerDot, { backgroundColor: Colors.dark.secondary }]} />
              </View>
              <View style={[styles.mapMarker, { top: '60%', left: '55%' }]}>
                <View style={[styles.markerDot, { backgroundColor: Colors.dark.secondary }]} />
              </View>
              <View style={[styles.mapMarker, { top: '25%', left: '70%' }]}>
                <View style={[styles.markerDot, { backgroundColor: Colors.dark.secondary }]} />
              </View>
              <View style={styles.mapLabel}>
                <Feather name="map" size={14} color={Colors.dark.textTertiary} />
                <Text style={styles.mapLabelText}>Live Rider Map</Text>
              </View>
            </View>
          </View>
        </GlassCard>

        <View style={styles.statsRow}>
          <StatCard icon="users" label="Nearby" value={nearbyCount.toString()} color={Colors.dark.secondary} />
          <StatCard icon="navigation" label="Active Rides" value={activeRides.toString()} color={Colors.dark.accent} />
          <StatCard icon="trending-up" label="Your KM" value={`${(currentUser.totalKm / 1000).toFixed(1)}k`} color={Colors.dark.success} />
        </View>

        <GlassCard>
          <XPBar current={currentUser.xp % 500} max={500} level={currentUser.level} />
        </GlassCard>

        <View style={styles.quickSection}>
          <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
          <View style={styles.quickRow}>
            <Pressable style={({ pressed }) => [styles.quickBtn, pressed && styles.quickBtnPressed]}>
              <Feather name="plus-circle" size={22} color={Colors.dark.accent} />
              <Text style={styles.quickBtnText}>New Ride</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.quickBtn, pressed && styles.quickBtnPressed]}>
              <Feather name="users" size={22} color={Colors.dark.secondary} />
              <Text style={styles.quickBtnText}>Find Group</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.quickBtn, pressed && styles.quickBtnPressed]}>
              <Feather name="map-pin" size={22} color={Colors.dark.success} />
              <Text style={styles.quickBtnText}>Explore</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View style={styles.sosWrapper}>
        <SOSButton onPress={() => router.push('/sos')} size={64} />
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
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  greetingLeft: {
    gap: 0,
  },
  greeting: {
    fontFamily: 'Rajdhani_400Regular',
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  userName: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 26,
    color: Colors.dark.text,
    letterSpacing: 1,
  },
  weatherRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weatherLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  weatherTemp: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 22,
    color: Colors.dark.text,
  },
  weatherCond: {
    fontFamily: 'Rajdhani_400Regular',
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  weatherRight: {
    gap: 4,
  },
  weatherStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weatherVal: {
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  weatherNote: {
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 12,
    color: Colors.dark.success,
    marginTop: 8,
  },
  mapContainer: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    position: 'relative',
  },
  mapGrid: {
    ...StyleSheet.absoluteFillObject,
  },
  mapGridLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: Colors.dark.glassBorder,
  },
  mapGridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.dark.glassBorder,
  },
  mapMarker: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.dark.accent,
    borderWidth: 2,
    borderColor: Colors.dark.background,
  },
  markerPulse: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.dark.accent + '30',
  },
  mapLabel: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.dark.background + 'CC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  mapLabelText: {
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickSection: {
    gap: 10,
  },
  sectionTitle: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 12,
    color: Colors.dark.textTertiary,
    letterSpacing: 2,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.glassBorder,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 6,
  },
  quickBtnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  quickBtnText: {
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  sosWrapper: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    zIndex: 10,
  },
});
