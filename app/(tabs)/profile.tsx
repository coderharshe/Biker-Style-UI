import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeInDown,
  FadeInRight
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import GlassCard from '@/components/GlassCard';
import Avatar from '@/components/Avatar';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/hooks/useProfile';
import { badges } from '@/data/mockData';

const { width: SCREEN_W } = Dimensions.get('window');

// Titles based on rank
const RANK_TITLES: { [key: number]: string } = {
  1: 'SUPREME RIDER',
  2: 'ELITE WARRIOR',
  3: 'NIGHT GHOST',
  4: 'ROAD COMMANDER',
  5: 'PHANTOM LEAD',
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, loading: profileLoading } = useProfile();
  
  // Use mock badges for now, filtered by real user if we had a mapping
  const earnedBadges = badges.slice(0, 5); 

  const scanLinePos = useSharedValue(0);
  const glowOpacity = useSharedValue(0.4);

  useEffect(() => {
    scanLinePos.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1500 }),
        withTiming(0.4, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const scanLineStyle = useAnimatedStyle(() => ({
    top: `${scanLinePos.value * 100}%`,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handleLogout = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await supabase.auth.signOut();
    router.replace('/login');
  };

  if (profileLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: Colors.dark.text, fontFamily: 'Rajdhani_600SemiBold' }}>INITIALIZING SCAN...</Text>
      </View>
    );
  }

  const userRank = 3; // Default or calculated
  const title = RANK_TITLES[userRank] || 'STREET RIDER';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0B0B0B', '#1a1a1a', '#0B0B0B']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={[styles.scroll, {
          paddingTop: insets.top + (Platform.OS === 'web' ? 20 : 10),
          paddingBottom: 120
        }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Caller Card Section */}
        <Animated.View entering={FadeInDown.duration(800)} style={styles.callerCardContainer}>
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1558981403-c5f91cbba527?q=80&w=2070&auto=format&fit=crop' }}
            style={styles.callerCard}
            imageStyle={styles.cardBackgroundImage}
          >
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)', '#0B0B0B']}
              style={StyleSheet.absoluteFill}
            />

            {/* Animated Scan Line */}
            <Animated.View style={[styles.scanLine, scanLineStyle]} />

            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankNum}>#{userRank}</Text>
                </View>
                <View style={styles.titleFrame}>
                  <Text style={styles.titleText}>{title}</Text>
                </View>
              </View>

              <View style={styles.profileRow}>
                <View style={styles.avatarContainer}>
                  <View style={styles.avatarBorder}>
                    <Avatar initials={profile?.username?.substring(0, 2).toUpperCase() || 'GR'} size={70} color={Colors.dark.accent} />
                  </View>
                  <View style={styles.levelTag}>
                    <Text style={styles.levelTagText}>{profile?.level || 1}</Text>
                  </View>
                </View>

                <View style={styles.profileInfo}>
                  <Text style={styles.userName}>{profile?.username || 'Ghost Rider'}</Text>
                  <View style={styles.bikeTag}>
                    <Feather name="zap" size={12} color={Colors.dark.accent} />
                    <Text style={styles.bikeTagText}>{(profile?.bike_model || 'Sport').toUpperCase()} CLASS</Text>
                  </View>
                </View>
              </View>

              {/* Progress Bar in Card */}
              <View style={styles.cardXPContainer}>
                <View style={styles.xpHeader}>
                  <Text style={styles.xpLabel}>EXPERIENCE POINT</Text>
                  <Text style={styles.xpValue}>{profile?.xp || 0} XP</Text>
                </View>
                <View style={styles.xpTrack}>
                  <View style={[styles.xpFill, { width: `${Math.min((profile?.xp || 0) / 10, 100)}%` }]}>
                    <Animated.View style={[styles.xpGlow, glowStyle]} />
                  </View>
                </View>
              </View>
            </View>
          </ImageBackground>
        </Animated.View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <Animated.View entering={FadeInRight.delay(200)} style={styles.statBox}>
            <Text style={styles.statLabel}>ALL TIME KM</Text>
            <Text style={styles.statValue}>0</Text>
            <View style={styles.statIconWrap}>
              <Feather name="navigation" size={16} color={Colors.dark.accent} />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInRight.delay(300)} style={styles.statBox}>
            <Text style={styles.statLabel}>SOS RESCUES</Text>
            <Text style={styles.statValue}>0</Text>
            <View style={[styles.statIconWrap, { backgroundColor: Colors.dark.secondaryDim }]}>
              <Feather name="shield" size={16} color={Colors.dark.secondary} />
            </View>
          </Animated.View>
        </View>

        {/* Badges Carousel Style */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>COLLECTED BADGES</Text>
            <Text style={styles.sectionCounter}>{earnedBadges.length}/{badges.length}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgesScroll}>
            {earnedBadges.map((badge, idx) => (
              <Animated.View key={badge.id} entering={FadeInRight.delay(400 + idx * 100)} style={styles.badgeCard}>
                <View style={styles.badgeIconWrap}>
                  <Feather name={badge.icon as any} size={24} color={Colors.dark.accent} />
                </View>
                <Text style={styles.badgeName}>{badge.name.toUpperCase()}</Text>
              </Animated.View>
            ))}
          </ScrollView>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OPERATIONS</Text>
          <GlassCard style={styles.actionCard} noPadding>
            {[
              { icon: 'settings', label: 'VEHICLE SETUP' },
              { icon: 'bell', label: 'COMMS CENTER' },
              { icon: 'share-2', label: 'SHARE PROFILE' },
            ].map((item, idx) => (
              <Pressable
                key={item.label}
                style={({ pressed }) => [
                  styles.actionItem,
                  idx > 0 && styles.itemBorder,
                  pressed && { backgroundColor: 'rgba(255,255,255,0.05)' },
                ]}
              >
                <View style={styles.actionLeft}>
                  <Feather name={item.icon as any} size={18} color={Colors.dark.accent} />
                  <Text style={styles.actionLabel}>{item.label}</Text>
                </View>
                <Feather name="chevron-right" size={18} color={Colors.dark.textTertiary} />
              </Pressable>
            ))}
          </GlassCard>
        </View>

        <Pressable
          style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.8 }]}
          onPress={handleLogout}
        >
          <LinearGradient
            colors={['rgba(255,59,48,0.2)', 'rgba(255,59,48,0.05)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
          />
          <Feather name="log-out" size={18} color={Colors.dark.sos} />
          <Text style={styles.logoutText}>TERMINATE SESSION</Text>
        </Pressable>
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
    gap: 20,
  },
  callerCardContainer: {
    width: '100%',
    height: 240,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    marginTop: 10,
  },
  callerCard: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-end',
  },
  cardBackgroundImage: {
    opacity: 0.6,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.dark.accent + '60',
    zIndex: 2,
    shadowColor: Colors.dark.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
  },
  cardContent: {
    zIndex: 5,
    gap: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rankBadge: {
    backgroundColor: '#000',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.dark.accent,
  },
  rankNum: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 16,
    color: Colors.dark.accent,
  },
  titleFrame: {
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    transform: [{ skewX: '-15deg' }],
  },
  titleText: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 12,
    color: '#000',
    transform: [{ skewX: '15deg' }],
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarBorder: {
    padding: 3,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: Colors.dark.accent,
    borderStyle: 'dashed',
  },
  levelTag: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: Colors.dark.accent,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  levelTagText: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 12,
    color: '#000',
  },
  profileInfo: {
    gap: 2,
  },
  userName: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 28,
    color: Colors.dark.text,
    letterSpacing: 1,
  },
  bikeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bikeTagText: {
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 10,
    color: Colors.dark.accent,
    letterSpacing: 1,
  },
  cardXPContainer: {
    gap: 6,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  xpLabel: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 10,
    color: Colors.dark.textTertiary,
    letterSpacing: 2,
  },
  xpValue: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 10,
    color: Colors.dark.text,
  },
  xpTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: Colors.dark.accent,
    borderRadius: 3,
  },
  xpGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.glassBorder,
    gap: 4,
  },
  statLabel: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 10,
    color: Colors.dark.textTertiary,
    letterSpacing: 1.5,
  },
  statValue: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 22,
    color: Colors.dark.text,
  },
  statIconWrap: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.dark.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 12,
    color: Colors.dark.textSecondary,
    letterSpacing: 2.5,
  },
  sectionCounter: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 12,
    color: Colors.dark.accent,
  },
  badgesScroll: {
    gap: 10,
    paddingRight: 20,
  },
  badgeCard: {
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  badgeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeName: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 9,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
  actionCard: {
    backgroundColor: Colors.dark.card,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  itemBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionLabel: {
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 15,
    color: Colors.dark.text,
    letterSpacing: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.3)',
    height: 54,
    gap: 10,
    marginTop: 10,
    overflow: 'hidden',
  },
  logoutText: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 14,
    color: Colors.dark.sos,
    letterSpacing: 2,
  },
});
