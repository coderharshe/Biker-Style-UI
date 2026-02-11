import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import GlassCard from '@/components/GlassCard';
import Avatar from '@/components/Avatar';
import RiderRow from '@/components/RiderRow';
import { riders, currentUser } from '@/data/mockData';

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const top3 = riders.slice(0, 3);
  const rest = riders.slice(3);

  const podiumColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
  const podiumHeights = [110, 90, 76];

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0) }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Leaderboard</Text>

        <View style={styles.podium}>
          {[top3[1], top3[0], top3[2]].map((rider, idx) => {
            const actualIdx = idx === 0 ? 1 : idx === 1 ? 0 : 2;
            return (
              <Animated.View
                key={rider.id}
                entering={FadeIn.delay(200 + actualIdx * 150).duration(500)}
                style={styles.podiumItem}
              >
                <View style={styles.podiumAvatarWrap}>
                  <Avatar
                    initials={rider.avatar}
                    size={idx === 1 ? 56 : 46}
                    color={podiumColors[actualIdx]}
                  />
                  <View style={[styles.rankBadge, { backgroundColor: podiumColors[actualIdx] }]}>
                    <Text style={styles.rankBadgeText}>{actualIdx + 1}</Text>
                  </View>
                </View>
                <Text style={styles.podiumName}>{rider.name}</Text>
                <Text style={[styles.podiumXp, { color: podiumColors[actualIdx] }]}>
                  {rider.xp.toLocaleString()}
                </Text>
                <View style={[styles.podiumBar, { height: podiumHeights[actualIdx], backgroundColor: podiumColors[actualIdx] + '20', borderColor: podiumColors[actualIdx] + '40' }]}>
                  <Feather name="award" size={16} color={podiumColors[actualIdx]} />
                  <Text style={[styles.podiumBadgeCount, { color: podiumColors[actualIdx] }]}>{rider.badges.length}</Text>
                </View>
              </Animated.View>
            );
          })}
        </View>

        <GlassCard>
          <View style={styles.yourRankRow}>
            <View style={styles.yourRankLeft}>
              <Text style={styles.yourRankLabel}>YOUR RANK</Text>
              <Text style={styles.yourRankValue}>#{currentUser.rank}</Text>
            </View>
            <View style={styles.yourRankRight}>
              <Text style={styles.yourRankXp}>{currentUser.xp.toLocaleString()} XP</Text>
              <View style={styles.yourBadgeRow}>
                <Feather name="award" size={14} color={Colors.dark.accent} />
                <Text style={styles.yourBadgeCount}>{currentUser.badges.length} badges</Text>
              </View>
            </View>
          </View>
        </GlassCard>

        <Text style={styles.sectionTitle}>ALL RIDERS</Text>
        <View style={styles.riderList}>
          {riders.map((rider, index) => (
            <Animated.View key={rider.id} entering={FadeIn.delay(index * 50).duration(300)}>
              <RiderRow
                rider={rider}
                isCurrentUser={rider.id === currentUser.id}
                showRank
              />
            </Animated.View>
          ))}
        </View>
      </ScrollView>
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
  screenTitle: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 28,
    color: Colors.dark.text,
    letterSpacing: 1,
    paddingTop: 12,
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 8,
    paddingTop: 16,
    paddingBottom: 8,
  },
  podiumItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  podiumAvatarWrap: {
    position: 'relative',
    marginBottom: 4,
  },
  rankBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.dark.background,
  },
  rankBadgeText: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 11,
    color: Colors.dark.background,
  },
  podiumName: {
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 13,
    color: Colors.dark.text,
  },
  podiumXp: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 14,
  },
  podiumBar: {
    width: '80%',
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  podiumBadgeCount: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 12,
  },
  yourRankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  yourRankLeft: {
    gap: 2,
  },
  yourRankLabel: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 11,
    color: Colors.dark.textTertiary,
    letterSpacing: 2,
  },
  yourRankValue: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 32,
    color: Colors.dark.accent,
  },
  yourRankRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  yourRankXp: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 18,
    color: Colors.dark.text,
  },
  yourBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  yourBadgeCount: {
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  sectionTitle: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 12,
    color: Colors.dark.textTertiary,
    letterSpacing: 2,
  },
  riderList: {
    gap: 8,
  },
});
