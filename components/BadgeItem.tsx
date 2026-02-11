import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import type { Badge } from '@/data/mockData';

interface BadgeItemProps {
  badge: Badge;
}

export default function BadgeItem({ badge }: BadgeItemProps) {
  return (
    <View style={[styles.container, !badge.earned && styles.locked]}>
      <View style={[styles.iconWrap, { backgroundColor: badge.earned ? Colors.dark.accentDim : Colors.dark.glass }]}>
        <Feather
          name={badge.icon as any}
          size={22}
          color={badge.earned ? Colors.dark.accent : Colors.dark.textTertiary}
        />
      </View>
      <Text style={[styles.name, !badge.earned && styles.lockedText]} numberOfLines={1}>{badge.name}</Text>
      {!badge.earned && (
        <Feather name="lock" size={10} color={Colors.dark.textTertiary} style={styles.lockIcon} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '30%',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  locked: {
    opacity: 0.5,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.glassBorder,
  },
  name: {
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 11,
    color: Colors.dark.text,
    textAlign: 'center',
  },
  lockedText: {
    color: Colors.dark.textTertiary,
  },
  lockIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});
