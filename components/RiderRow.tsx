import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import Avatar from './Avatar';
import type { Rider } from '@/data/mockData';

interface RiderRowProps {
  rider: Rider;
  isCurrentUser?: boolean;
  showRank?: boolean;
}

export default function RiderRow({ rider, isCurrentUser, showRank }: RiderRowProps) {
  const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
  const rankColor = rider.rank <= 3 ? rankColors[rider.rank - 1] : Colors.dark.textTertiary;

  return (
    <View style={[styles.container, isCurrentUser && styles.highlight]}>
      {showRank && (
        <View style={styles.rankWrap}>
          <Text style={[styles.rank, { color: rankColor }]}>#{rider.rank}</Text>
        </View>
      )}
      <Avatar
        initials={rider.avatar}
        size={42}
        color={isCurrentUser ? Colors.dark.accent : Colors.dark.secondary}
      />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{rider.name}</Text>
          {isCurrentUser && <Text style={styles.youTag}>YOU</Text>}
        </View>
        <Text style={styles.meta}>{rider.bikeType} | LVL {rider.level}</Text>
      </View>
      <View style={styles.stats}>
        <Text style={styles.xp}>{rider.xp.toLocaleString()} XP</Text>
        <View style={styles.badgeRow}>
          <Feather name="award" size={12} color={Colors.dark.accent} />
          <Text style={styles.badgeCount}>{rider.badges.length}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.glassBorder,
    padding: 12,
    gap: 10,
  },
  highlight: {
    borderColor: Colors.dark.accent + '40',
    backgroundColor: Colors.dark.accentDim,
  },
  rankWrap: {
    width: 32,
    alignItems: 'center',
  },
  rank: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 16,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 15,
    color: Colors.dark.text,
  },
  youTag: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 9,
    color: Colors.dark.accent,
    backgroundColor: Colors.dark.accentDim,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
    letterSpacing: 1,
  },
  meta: {
    fontFamily: 'Rajdhani_400Regular',
    fontSize: 12,
    color: Colors.dark.textTertiary,
  },
  stats: {
    alignItems: 'flex-end',
    gap: 4,
  },
  xp: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 14,
    color: Colors.dark.accent,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  badgeCount: {
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
});
