import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import GlassCard from '@/components/GlassCard';

interface MissionTrackerProps {
  xp: number;
  nextLevelXP: number;
  levelTitle: string;
  missions: { title: string; icon: string; xp: number; done: boolean }[];
}

export default function MissionTracker({ xp, nextLevelXP, levelTitle, missions }: MissionTrackerProps) {
  const xpProgress = useSharedValue(0);

  useEffect(() => {
    xpProgress.value = withTiming(xp / nextLevelXP, { duration: 1600, easing: Easing.out(Easing.cubic) });
  }, [xp, nextLevelXP]);

  const xpBarStyle = useAnimatedStyle(() => ({
    width: `${xpProgress.value * 100}%`,
  }));

  return (
    <GlassCard>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Feather name="zap" size={16} color={Colors.dark.accent} />
          <Text style={styles.title}>{levelTitle}</Text>
        </View>
        <Text style={styles.xpText}>{xp} / {nextLevelXP} XP</Text>
      </View>

      <View style={styles.track}>
        <Animated.View style={[styles.fill, xpBarStyle]}>
          <View style={styles.glow} />
        </Animated.View>
      </View>

      <View style={styles.missionList}>
        {missions.map((m, i) => (
          <View key={i} style={styles.missionRow}>
            <View style={[styles.missionIcon, { backgroundColor: m.done ? Colors.dark.success + '18' : Colors.dark.accentDim }]}>
              <Feather name={m.done ? 'check' : m.icon as any} size={14} color={m.done ? Colors.dark.success : Colors.dark.accent} />
            </View>
            <View style={styles.missionInfo}>
              <Text style={[styles.missionTitle, m.done && styles.missionDone]}>{m.title}</Text>
              <Text style={styles.missionXP}>+{m.xp} XP</Text>
            </View>
            {m.done && <Feather name="check-circle" size={16} color={Colors.dark.success} />}
          </View>
        ))}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...Typography.h3,
    fontSize: 18,
    color: Colors.dark.text,
  },
  xpText: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  track: {
    height: 6,
    backgroundColor: Colors.dark.glassBorder,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 20,
  },
  fill: {
    height: 6,
    backgroundColor: Colors.dark.accent,
    borderRadius: 3,
  },
  glow: {
    position: 'absolute',
    right: 0,
    top: -1,
    bottom: -1,
    width: 24,
    backgroundColor: Colors.dark.accent,
    borderRadius: 3,
    shadowColor: Colors.dark.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  missionList: {
    gap: 12,
  },
  missionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    ...Typography.body,
    fontSize: 14,
    color: Colors.dark.text,
  },
  missionDone: {
    color: Colors.dark.textTertiary,
    textDecorationLine: 'line-through',
  },
  missionXP: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.dark.accent,
    marginTop: -2,
  },
});
