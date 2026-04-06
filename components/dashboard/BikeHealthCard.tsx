import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import GlassCard from '@/components/GlassCard';

interface BikeHealthProps {
  analytics: {
    serviceDueKM: number;
    fuelEfficiency: string;
    tireHealth: number;
    safetyScore: number;
    weeklyKM: number;
    rideHours: number;
  };
}

export default function BikeHealthCard({ analytics }: BikeHealthProps) {
  const tireProgress = useSharedValue(0);
  const safetyProgress = useSharedValue(0);

  useEffect(() => {
    tireProgress.value = withTiming(analytics.tireHealth / 100, { duration: 1200, easing: Easing.out(Easing.cubic) });
    safetyProgress.value = withTiming(analytics.safetyScore / 100, { duration: 1400, easing: Easing.out(Easing.cubic) });
  }, [analytics.tireHealth, analytics.safetyScore]);

  const tireBarStyle = useAnimatedStyle(() => ({
    width: `${tireProgress.value * 100}%`,
  }));

  const safetyBarStyle = useAnimatedStyle(() => ({
    width: `${safetyProgress.value * 100}%`,
  }));

  const tireColor = analytics.tireHealth > 60 ? Colors.dark.success : analytics.tireHealth > 30 ? Colors.dark.accent : Colors.dark.sos;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <GlassCard style={styles.miniCard}>
          <Feather name="trending-up" size={16} color={Colors.dark.secondary} />
          <Text style={styles.miniLabel}>Weekly</Text>
          <Text style={styles.miniValue}>{analytics.weeklyKM} KM</Text>
          <Text style={styles.miniSub}>{analytics.rideHours} hrs</Text>
        </GlassCard>
        <GlassCard style={styles.miniCard}>
          <Feather name="shield" size={16} color={Colors.dark.success} />
          <Text style={styles.miniLabel}>Safety</Text>
          <Text style={styles.miniValue}>{analytics.safetyScore}/100</Text>
          <View style={styles.trackMini}>
             <Animated.View style={[styles.fillMini, safetyBarStyle, { backgroundColor: Colors.dark.success }]} />
          </View>
        </GlassCard>
      </View>

      <GlassCard>
        <View style={styles.header}>
          <Feather name="settings" size={15} color={Colors.dark.accent} />
          <Text style={styles.title}>BIKE HEALTH</Text>
        </View>
        <View style={styles.statsGrid}>
          <View>
            <Text style={styles.statLabel}>Next Service</Text>
            <Text style={styles.statValue}>{analytics.serviceDueKM} KM</Text>
          </View>
          <View>
            <Text style={styles.statLabel}>Fuel Efficiency</Text>
            <Text style={styles.statValue}>{analytics.fuelEfficiency}</Text>
          </View>
        </View>
        <View style={styles.tireRow}>
          <Text style={styles.tireLabel}>Tire Condition</Text>
          <Text style={[styles.tirePercent, { color: tireColor }]}>{analytics.tireHealth}%</Text>
        </View>
        <View style={styles.trackLarge}>
          <Animated.View style={[styles.fillLarge, tireBarStyle, { backgroundColor: tireColor }]} />
        </View>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 14,
  },
  miniCard: {
    flex: 1,
    gap: 4,
  },
  miniLabel: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.dark.textTertiary,
  },
  miniValue: {
    ...Typography.h3,
    fontSize: 20,
    color: Colors.dark.text,
  },
  miniSub: {
    ...Typography.body,
    fontSize: 11,
    color: Colors.dark.textTertiary,
    marginTop: -2,
  },
  trackMini: {
    height: 4,
    backgroundColor: Colors.dark.glassBorder,
    borderRadius: 2,
    marginTop: 4,
  },
  fillMini: {
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    ...Typography.caption,
    color: Colors.dark.accent,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statLabel: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.dark.textTertiary,
  },
  statValue: {
    ...Typography.h3,
    fontSize: 18,
    color: Colors.dark.text,
  },
  tireRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  tireLabel: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  tirePercent: {
    ...Typography.h3,
    fontSize: 16,
  },
  trackLarge: {
    height: 6,
    backgroundColor: Colors.dark.glassBorder,
    borderRadius: 3,
  },
  fillLarge: {
    height: 6,
    borderRadius: 3,
  },
});
