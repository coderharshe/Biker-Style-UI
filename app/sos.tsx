import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import Avatar from '@/components/Avatar';
import GlassCard from '@/components/GlassCard';
import { sosHelpers } from '@/data/mockData';

export default function SOSScreen() {
  const insets = useSafeAreaInsets();

  // Animation values
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.6);
  const radarRotation = useSharedValue(0);
  const scanOpacity = useSharedValue(0.2);

  useEffect(() => {
    // Initial error notification
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    // Continuous pulse for the SOS icon
    pulseScale.value = withRepeat(
      withTiming(2.2, { duration: 2000, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    pulseOpacity.value = withRepeat(
      withTiming(0, { duration: 2000, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );

    // Radar rotation
    radarRotation.value = withRepeat(
      withTiming(360, { duration: 4000, easing: Easing.linear }),
      -1,
      false
    );

    // Scanning text pulse
    scanOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.2, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const pulseAnim = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const radarAnim = useAnimatedStyle(() => ({
    transform: [{ rotate: `${radarRotation.value}deg` }],
  }));

  const scanTextAnim = useAnimatedStyle(() => ({
    opacity: scanOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a0505', '#0B0B0B']}
        style={StyleSheet.absoluteFill}
      />

      {/* Dynamic Background Accents */}
      <View style={styles.glowTop} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + (Platform.OS === 'web' ? 20 : 10),
            paddingBottom: insets.bottom + 100
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.closeBtn}
          >
            <View style={styles.closeBtnInner}>
              <Feather name="x" size={24} color={Colors.dark.text} />
            </View>
          </Pressable>
        </View>

        <View style={styles.alertSection}>
          <View style={styles.radarContainer}>
            <Animated.View style={[styles.pulseRing, pulseAnim]} />
            <Animated.View style={[styles.pulseRing, pulseAnim, { width: 140, height: 140, borderRadius: 70 }]} />

            <View style={styles.alertIconOuter}>
              <LinearGradient
                colors={[Colors.dark.sos, '#8B0000']}
                style={styles.alertIcon}
              >
                <Feather name="alert-triangle" size={44} color="#FFF" />
              </LinearGradient>
            </View>

            {/* Radar Sweeper */}
            <Animated.View style={[styles.radarSweeper, radarAnim]}>
              <LinearGradient
                colors={['transparent', Colors.dark.sos + '40']}
                style={styles.radarGradient}
              />
            </Animated.View>
          </View>

          <Animated.View entering={FadeInDown.delay(200)} style={styles.textContainer}>
            <Text style={styles.alertTitle}>EMERGENCY ALERT</Text>
            <View style={styles.statusRow}>
              <Animated.View style={[styles.statusDot, scanTextAnim]} />
              <Text style={styles.alertSubtitle}>Broadcasting SOS to nearby riders...</Text>
            </View>
          </Animated.View>
        </View>

        <View style={styles.helpersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>RESPONDING HELPERS</Text>
            <View style={styles.helperCount}>
              <Text style={styles.helperCountText}>{sosHelpers.length}</Text>
            </View>
          </View>

          {sosHelpers.map((helper, index) => (
            <Animated.View
              key={helper.id}
              entering={FadeInDown.delay(400 + index * 100).duration(600)}
            >
              <GlassCard style={styles.helperCard}>
                <View style={styles.helperContent}>
                  <View style={styles.avatarWrap}>
                    <Avatar initials={helper.name.substring(0, 2).toUpperCase()} size={42} color={Colors.dark.secondary} />
                    <View style={styles.onlineBadge} />
                  </View>

                  <View style={styles.helperInfo}>
                    <Text style={styles.helperName}>{helper.name}</Text>
                    <View style={styles.bikeInfo}>
                      <Feather name="shield" size={12} color={Colors.dark.textTertiary} />
                      <Text style={styles.helperMeta}>{helper.bikeType}</Text>
                    </View>
                  </View>

                  <View style={styles.helperStats}>
                    <Text style={styles.helperEta}>{helper.eta}</Text>
                    <Text style={styles.helperDist}>{helper.distance}</Text>
                  </View>
                </View>

                <View style={styles.cardAction}>
                  <Text style={styles.connectingText}>CONNECTING...</Text>
                  <View style={styles.progressBar}>
                    <Animated.View
                      style={[styles.progressFill, { width: '65%' }]}
                    />
                  </View>
                </View>
              </GlassCard>
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      {/* Floating Bottom Action */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 20 }]}>
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)', '#000']}
          style={styles.bottomGradient}
        />
        <Pressable
          style={({ pressed }) => [
            styles.cancelBtn,
            pressed && { transform: [{ scale: 0.98 }] }
          ]}
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            }
            router.back();
          }}
        >
          <View style={styles.cancelBtnGlow} />
          <Feather name="slash" size={20} color={Colors.dark.sos} />
          <Text style={styles.cancelText}>CANCEL EMERGENCY</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  glowTop: {
    position: 'absolute',
    top: -100,
    left: '10%',
    right: '10%',
    height: 300,
    backgroundColor: Colors.dark.sos + '15',
    borderRadius: 150,
  },
  scrollContent: {
    paddingHorizontal: 20,
    flexGrow: 1,
  },
  header: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  closeBtn: {
    width: 44,
    height: 44,
  },
  closeBtnInner: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  alertSection: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  radarContainer: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: Colors.dark.sos + '60',
  },
  alertIconOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    padding: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    zIndex: 10,
    shadowColor: Colors.dark.sos,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15,
  },
  alertIcon: {
    flex: 1,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarSweeper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 120,
    borderWidth: 1,
    borderColor: Colors.dark.sos + '10',
    overflow: 'hidden',
  },
  radarGradient: {
    width: '50%',
    height: '100%',
    position: 'absolute',
    right: 0,
    borderTopRightRadius: 120,
    borderBottomRightRadius: 120,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  alertTitle: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 28,
    color: Colors.dark.text,
    letterSpacing: 4,
    textShadowColor: Colors.dark.sos + '80',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.sos,
  },
  alertSubtitle: {
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 14,
    color: Colors.dark.textSecondary,
    letterSpacing: 0.5,
  },
  helpersSection: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 12,
    color: Colors.dark.textSecondary,
    letterSpacing: 2.5,
  },
  helperCount: {
    backgroundColor: Colors.dark.secondaryDim,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.secondary + '40',
  },
  helperCountText: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 11,
    color: Colors.dark.secondary,
  },
  helperCard: {
    marginBottom: 4,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  helperContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    position: 'relative',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.dark.success,
    borderWidth: 2,
    borderColor: '#111',
  },
  helperInfo: {
    flex: 1,
    gap: 2,
  },
  helperName: {
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 16,
    color: Colors.dark.text,
  },
  bikeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  helperMeta: {
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 12,
    color: Colors.dark.textTertiary,
  },
  helperStats: {
    alignItems: 'flex-end',
    gap: 1,
  },
  helperEta: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 16,
    color: Colors.dark.secondary,
  },
  helperDist: {
    fontFamily: 'Rajdhani_400Regular',
    fontSize: 11,
    color: Colors.dark.textTertiary,
  },
  cardAction: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: 8,
  },
  connectingText: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 10,
    color: Colors.dark.textTertiary,
    letterSpacing: 1.5,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.dark.secondary,
    borderRadius: 2,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    zIndex: 100,
  },
  bottomGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.sos + '40',
    height: 58,
    gap: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  cancelBtnGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.dark.sos + '05',
  },
  cancelText: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 15,
    color: Colors.dark.sos,
    letterSpacing: 3,
  },
});
