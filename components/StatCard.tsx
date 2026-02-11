import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Colors from '@/constants/colors';

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  color?: string;
}

export default function StatCard({ icon, label, value, color = Colors.dark.accent }: StatCardProps) {
  return (
    <View style={[styles.card, { borderColor: color + '20' }]}>
      <View style={[styles.iconWrap, { backgroundColor: color + '18' }]}>
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 20,
    color: Colors.dark.text,
  },
  label: {
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 11,
    color: Colors.dark.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
