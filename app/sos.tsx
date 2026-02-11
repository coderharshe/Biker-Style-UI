import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import Avatar from '@/components/Avatar';
import { sosHelpers } from '@/data/mockData';

export default function SOSScreen() {
  const insets = useSafeAreaInsets();
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.6);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    pulseScale.value = withRepeat(
      withTiming(2, { duration: 1500, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    pulseOpacity.value = withRepeat(
      withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
  }, []);

  const pulseAnim = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  return (
    <LinearGradient
      colors={['rgba(255,59,48,0.3)', 'rgba(255,59,48,0.08)', Colors.dark.background]}
      style={[styles.container, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0), paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) }]}
    >
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="x" size={24} color={Colors.dark.text} />
        </Pressable>
      </View>

      <View style={styles.alertSection}>
        <View style={styles.alertCircle}>
          <Animated.View style={[styles.pulseRing, pulseAnim]} />
          <View style={styles.alertIcon}>
            <Feather name="alert-triangle" size={40} color="#FFF" />
          </View>
        </View>
        <Text style={styles.alertTitle}>Emergency Alert Sent</Text>
        <Text style={styles.alertSubtitle}>Nearby riders are being notified</Text>
      </View>

      <View style={styles.helpersSection}>
        <Text style={styles.sectionTitle}>NEARBY HELPERS</Text>
        {sosHelpers.map((helper, index) => (
          <Animated.View
            key={helper.id}
            entering={FadeIn.delay(300 + index * 100).duration(400)}
            style={styles.helperRow}
          >
            <Avatar initials={helper.name.substring(0, 2).toUpperCase()} size={40} color={Colors.dark.secondary} />
            <View style={styles.helperInfo}>
              <Text style={styles.helperName}>{helper.name}</Text>
              <Text style={styles.helperMeta}>{helper.bikeType}</Text>
            </View>
            <View style={styles.helperStats}>
              <Text style={styles.helperEta}>{helper.eta}</Text>
              <Text style={styles.helperDist}>{helper.distance}</Text>
            </View>
          </Animated.View>
        ))}
      </View>

      <View style={styles.bottomSection}>
        <Pressable
          style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.back();
          }}
        >
          <Feather name="x-circle" size={20} color={Colors.dark.sos} />
          <Text style={styles.cancelText}>CANCEL SOS</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    alignItems: 'flex-end',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertSection: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  alertCircle: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  pulseRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.dark.sos,
  },
  alertIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.dark.sos,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 24,
    color: Colors.dark.text,
    letterSpacing: 1,
  },
  alertSubtitle: {
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  helpersSection: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 10,
  },
  sectionTitle: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 12,
    color: Colors.dark.textTertiary,
    letterSpacing: 2,
    marginBottom: 4,
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.glassBorder,
    padding: 12,
    gap: 12,
  },
  helperInfo: {
    flex: 1,
    gap: 2,
  },
  helperName: {
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 15,
    color: Colors.dark.text,
  },
  helperMeta: {
    fontFamily: 'Rajdhani_400Regular',
    fontSize: 12,
    color: Colors.dark.textTertiary,
  },
  helperStats: {
    alignItems: 'flex-end',
    gap: 2,
  },
  helperEta: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 15,
    color: Colors.dark.secondary,
  },
  helperDist: {
    fontFamily: 'Rajdhani_400Regular',
    fontSize: 12,
    color: Colors.dark.textTertiary,
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.sosDim,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.sos + '30',
    height: 54,
    gap: 8,
  },
  cancelText: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 16,
    color: Colors.dark.sos,
    letterSpacing: 2,
  },
});
