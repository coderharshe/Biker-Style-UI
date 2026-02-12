import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/colors';
import GlassCard from '@/components/GlassCard';
import Avatar from '@/components/Avatar';
import XPBar from '@/components/XPBar';
import StatCard from '@/components/StatCard';
import BadgeItem from '@/components/BadgeItem';
import { currentUser, badges } from '@/data/mockData';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const earnedBadges = badges.filter((b) => currentUser.badges.includes(b.id));

  const handleLogout = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await AsyncStorage.removeItem('motosphere_user');
    router.replace('/login');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0) }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <Avatar initials={currentUser.avatar} size={80} color={Colors.dark.accent} />
          <Text style={styles.userName}>{currentUser.name}</Text>
          <View style={styles.bikeTypeRow}>
            <Feather name="truck" size={14} color={Colors.dark.textSecondary} />
            <Text style={styles.bikeType}>{currentUser.bikeType}</Text>
          </View>
          <View style={styles.levelBadge}>
            <Feather name="star" size={14} color={Colors.dark.accent} />
            <Text style={styles.levelText}>LEVEL {currentUser.level}</Text>
          </View>
        </View>

        <GlassCard>
          <XPBar current={currentUser.xp % 500} max={500} level={currentUser.level} />
        </GlassCard>

        <View style={styles.statsRow}>
          <StatCard icon="navigation" label="Total KM" value={currentUser.totalKm.toLocaleString()} color={Colors.dark.accent} />
          <StatCard icon="shield" label="SOS Helps" value={currentUser.sosHelps.toString()} color={Colors.dark.secondary} />
          <StatCard icon="award" label="Badges" value={currentUser.badges.length.toString()} color={Colors.dark.success} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EARNED BADGES</Text>
          <View style={styles.badgesGrid}>
            {earnedBadges.map((badge) => (
              <BadgeItem key={badge.id} badge={badge} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SETTINGS</Text>
          <GlassCard noPadding>
            {[
              { icon: 'edit-3', label: 'Edit Profile' },
              { icon: 'bell', label: 'Notifications' },
              { icon: 'lock', label: 'Privacy' },
              { icon: 'help-circle', label: 'Help & Support' },
            ].map((item, idx) => (
              <Pressable
                key={item.label}
                style={({ pressed }) => [
                  styles.settingsItem,
                  idx > 0 && styles.settingsBorder,
                  pressed && { backgroundColor: Colors.dark.glass },
                ]}
              >
                <View style={styles.settingsLeft}>
                  <Feather name={item.icon as any} size={18} color={Colors.dark.textSecondary} />
                  <Text style={styles.settingsLabel}>{item.label}</Text>
                </View>
                <Feather name="chevron-right" size={18} color={Colors.dark.textTertiary} />
              </Pressable>
            ))}
          </GlassCard>
        </View>

        <Pressable
          style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
          onPress={handleLogout}
        >
          <Feather name="log-out" size={18} color={Colors.dark.sos} />
          <Text style={styles.logoutText}>SIGN OUT</Text>
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
    gap: 14,
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 4,
    gap: 6,
  },
  userName: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 26,
    color: Colors.dark.text,
    letterSpacing: 1,
    marginTop: 8,
  },
  bikeTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bikeType: {
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.accentDim,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
    marginTop: 4,
  },
  levelText: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 12,
    color: Colors.dark.accent,
    letterSpacing: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 12,
    color: Colors.dark.textTertiary,
    letterSpacing: 2,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 4,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingsBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsLabel: {
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 15,
    color: Colors.dark.text,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.sosDim,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.sos + '20',
    height: 50,
    gap: 8,
    marginTop: 4,
  },
  logoutText: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 14,
    color: Colors.dark.sos,
    letterSpacing: 2,
  },
});
