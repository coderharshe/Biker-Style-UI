import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';

interface SOSButtonProps {
  onPress: () => void;
  size?: number;
}

export default function SOSButton({ onPress, size = 72 }: SOSButtonProps) {
  const pulse1 = useSharedValue(1);
  const pulse2 = useSharedValue(1);
  const pulseOpacity1 = useSharedValue(0.4);
  const pulseOpacity2 = useSharedValue(0.3);

  useEffect(() => {
    pulse1.value = withRepeat(
      withTiming(1.6, { duration: 1500, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    pulseOpacity1.value = withRepeat(
      withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    setTimeout(() => {
      pulse2.value = withRepeat(
        withTiming(1.8, { duration: 1800, easing: Easing.out(Easing.ease) }),
        -1,
        false
      );
      pulseOpacity2.value = withRepeat(
        withTiming(0, { duration: 1800, easing: Easing.out(Easing.ease) }),
        -1,
        false
      );
    }, 500);
  }, []);

  const animPulse1 = useAnimatedStyle(() => ({
    transform: [{ scale: pulse1.value }],
    opacity: pulseOpacity1.value,
  }));

  const animPulse2 = useAnimatedStyle(() => ({
    transform: [{ scale: pulse2.value }],
    opacity: pulseOpacity2.value,
  }));

  const handlePress = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onPress();
  };

  return (
    <View style={[styles.wrapper, { width: size * 2, height: size * 2 }]}>
      <Animated.View style={[styles.pulseRing, { width: size, height: size, borderRadius: size / 2 }, animPulse1]} />
      <Animated.View style={[styles.pulseRing2, { width: size, height: size, borderRadius: size / 2 }, animPulse2]} />
      <Pressable
        style={({ pressed }) => [
          styles.button,
          { width: size, height: size, borderRadius: size / 2 },
          pressed && { transform: [{ scale: 0.92 }] },
        ]}
        onPress={handlePress}
      >
        <Feather name="alert-triangle" size={size * 0.4} color="#FFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    backgroundColor: Colors.dark.sos,
  },
  pulseRing2: {
    position: 'absolute',
    backgroundColor: Colors.dark.sos,
  },
  button: {
    backgroundColor: Colors.dark.sos,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: Colors.dark.sos,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
});
