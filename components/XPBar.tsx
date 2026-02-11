import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import Colors from '@/constants/colors';

interface XPBarProps {
  current: number;
  max: number;
  level: number;
  showLabel?: boolean;
  height?: number;
}

export default function XPBar({ current, max, level, showLabel = true, height = 8 }: XPBarProps) {
  const progress = useSharedValue(0);
  const pct = Math.min(current / max, 1);

  useEffect(() => {
    progress.value = withTiming(pct, { duration: 1200, easing: Easing.bezierFn(0.25, 0.1, 0.25, 1) });
  }, [pct]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.container}>
      {showLabel && (
        <View style={styles.labelRow}>
          <Text style={styles.level}>LVL {level}</Text>
          <Text style={styles.xpText}>{current} / {max} XP</Text>
        </View>
      )}
      <View style={[styles.track, { height }]}>
        <Animated.View style={[styles.fill, { height }, animatedStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  level: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 13,
    color: Colors.dark.accent,
    letterSpacing: 1,
  },
  xpText: {
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  track: {
    width: '100%',
    backgroundColor: Colors.dark.accentDim,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    backgroundColor: Colors.dark.accent,
    borderRadius: 4,
  },
});
