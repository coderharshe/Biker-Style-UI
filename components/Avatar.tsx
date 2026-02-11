import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Colors from '@/constants/colors';

interface AvatarProps {
  initials: string;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export default function Avatar({ initials, size = 40, color, style }: AvatarProps) {
  const bgColor = color || Colors.dark.accent;
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor + '25' }, style]}>
      <Text style={[styles.text, { fontSize: size * 0.38, color: bgColor }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: 'Rajdhani_700Bold',
    letterSpacing: 1,
  },
});
