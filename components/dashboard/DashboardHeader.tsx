import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';

interface DashboardHeaderProps {
  name: string;
  rideStatus: string;
}

export default function DashboardHeader({ name, rideStatus }: DashboardHeaderProps) {
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 5) return 'Night Owl,';
    if (h < 12) return 'Good Morning,';
    if (h < 17) return 'Good Afternoon,';
    if (h < 21) return 'Good Evening,';
    return 'Night Owl,';
  };

  const statusColor = rideStatus.includes('Active') ? Colors.dark.success : Colors.dark.textTertiary;

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.label}>{getGreeting()}</Text>
        <Text style={styles.name}>{name || 'Rider'}</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: statusColor + '18', borderColor: statusColor + '40' }]}>
        <View style={[styles.dot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusText, { color: statusColor }]}>{rideStatus}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    textTransform: 'none',
  },
  name: {
    ...Typography.h2,
    color: Colors.dark.text,
    marginTop: -2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    marginTop: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    ...Typography.label,
    fontSize: 10,
  },
});
