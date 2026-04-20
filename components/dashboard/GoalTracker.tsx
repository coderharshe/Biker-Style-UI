import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';

interface GoalTrackerProps {
  currentKm: number;
  goalKm: number;
}

export default function GoalTracker({ currentKm, goalKm }: GoalTrackerProps) {
  const goalProgress = useSharedValue(0);

  useEffect(() => {
    goalProgress.value = withTiming(currentKm / goalKm, { duration: 1200, easing: Easing.out(Easing.cubic) });
  }, [currentKm, goalKm, goalProgress]);

  const goalBarStyle = useAnimatedStyle(() => ({
    width: `${goalProgress.value * 100}%`,
  }));

  const percent = Math.round((currentKm / goalKm) * 100);

  return (
    <View style={styles.container}>
      <View style={styles.goalRow}>
        <View>
          <Text style={styles.kmValue}>
            {currentKm} <Text style={styles.kmUnit}>/ {goalKm} KM</Text>
          </Text>
          <Text style={styles.label}>Today&apos;s Ride Goal</Text>
        </View>
        <Text style={styles.percentText}>{percent}%</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, goalBarStyle]}>
          <View style={styles.glow} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: -4,
  },
  kmValue: {
    ...Typography.h3,
    color: Colors.dark.accent,
  },
  kmUnit: {
    ...Typography.subtitle,
    fontSize: 14,
    color: Colors.dark.textTertiary,
  },
  label: {
    ...Typography.caption,
    color: Colors.dark.textTertiary,
    marginTop: -2,
  },
  percentText: {
    ...Typography.h3,
    color: Colors.dark.accent,
  },
  track: {
    height: 8,
    backgroundColor: Colors.dark.accentDim,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: 8,
    backgroundColor: Colors.dark.accent,
    borderRadius: 4,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    right: 0,
    top: -1,
    bottom: -1,
    width: 24,
    backgroundColor: Colors.dark.accent,
    borderRadius: 4,
    shadowColor: Colors.dark.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
});
