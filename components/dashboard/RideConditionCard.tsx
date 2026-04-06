import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import GlassCard from '@/components/GlassCard';

interface RideConditionsProps {
  conditions: {
    weather: string;
    temp: string;
    wind: string;
    humidity: string;
    roadRisk: 'Low' | 'Medium' | 'High';
    suggestedTime: string;
    icon: string;
  };
}

const RISK_COLORS = { 
  Low: Colors.dark.success, 
  Medium: Colors.dark.accent, 
  High: Colors.dark.sos 
} as const;

export default function RideConditionCard({ conditions }: RideConditionsProps) {
  const riskColor = RISK_COLORS[conditions.roadRisk];

  return (
    <GlassCard>
      <View style={styles.header}>
        <View style={styles.left}>
          <View style={styles.iconWrap}>
            <Feather name={conditions.icon as any} size={22} color={Colors.dark.warning} />
          </View>
          <View>
            <Text style={styles.temp}>{conditions.temp}°C</Text>
            <Text style={styles.weather}>{conditions.weather}</Text>
          </View>
        </View>
        <View style={styles.right}>
          <View style={styles.stat}>
            <Feather name="wind" size={13} color={Colors.dark.textTertiary} />
            <Text style={styles.statVal}>{conditions.wind}</Text>
          </View>
          <View style={styles.stat}>
            <Feather name="droplet" size={13} color={Colors.dark.textTertiary} />
            <Text style={styles.statVal}>{conditions.humidity}</Text>
          </View>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.footer}>
        <View style={styles.riskRow}>
          <Text style={styles.riskLabel}>Road Risk</Text>
          <View style={[styles.riskBadge, { backgroundColor: riskColor + '18', borderColor: riskColor + '40' }]}>
            <View style={[styles.riskDot, { backgroundColor: riskColor }]} />
            <Text style={[styles.riskText, { color: riskColor }]}>{conditions.roadRisk}</Text>
          </View>
        </View>
        <View style={styles.suggestedRow}>
          <Feather name="clock" size={12} color={Colors.dark.secondary} />
          <Text style={styles.suggestedText}>Best window: {conditions.suggestedTime}</Text>
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.dark.warning + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  temp: {
    ...Typography.h3,
    color: Colors.dark.text,
  },
  weather: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: -3,
  },
  right: {
    gap: 6,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statVal: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.dark.glassBorder,
    marginVertical: 10,
  },
  footer: {
    gap: 6,
  },
  riskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  riskLabel: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
  },
  riskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  riskText: {
    ...Typography.label,
    fontSize: 10,
  },
  suggestedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  suggestedText: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.dark.secondary,
  },
});
