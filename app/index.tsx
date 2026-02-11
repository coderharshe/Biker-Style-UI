import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SplashScreen() {
  const insets = useSafeAreaInsets();
  const logoScale = useSharedValue(0.5);
  const logoOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const barWidth = useSharedValue(0);
  const barOpacity = useSharedValue(0);

  useEffect(() => {
    logoScale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.back(1.5)) });
    logoOpacity.value = withTiming(1, { duration: 600 });
    taglineOpacity.value = withDelay(500, withTiming(1, { duration: 600 }));
    barOpacity.value = withDelay(800, withTiming(1, { duration: 400 }));
    barWidth.value = withDelay(900, withTiming(100, { duration: 1200, easing: Easing.inOut(Easing.ease) }));

    const timer = setTimeout(async () => {
      const user = await AsyncStorage.getItem('rideGuard_user');
      if (user) {
        router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const logoAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const taglineAnimStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  const barAnimStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value}%`,
    opacity: barOpacity.value,
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0), paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) }]}>
      <View style={styles.content}>
        <Animated.View style={[styles.logoWrap, logoAnimStyle]}>
          <View style={styles.logoCircle}>
            <Feather name="shield" size={48} color={Colors.dark.accent} />
          </View>
        </Animated.View>

        <Animated.View style={taglineAnimStyle}>
          <Text style={styles.appName}>RIDEGUARD</Text>
          <Text style={styles.tagline}>Ride Together. Stay Protected.</Text>
        </Animated.View>
      </View>

      <View style={styles.barContainer}>
        <Animated.View style={[styles.barTrack]}>
          <Animated.View style={[styles.barFill, barAnimStyle]} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 24,
  },
  logoWrap: {
    marginBottom: 8,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.dark.accentDim,
    borderWidth: 2,
    borderColor: Colors.dark.accent + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 36,
    color: Colors.dark.text,
    letterSpacing: 6,
    textAlign: 'center',
  },
  tagline: {
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 14,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 1,
  },
  barContainer: {
    position: 'absolute',
    bottom: 80,
    width: '60%',
  },
  barTrack: {
    height: 3,
    backgroundColor: Colors.dark.card,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.dark.accent,
    borderRadius: 2,
  },
});
