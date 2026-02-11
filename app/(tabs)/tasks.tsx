import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import GlassCard from '@/components/GlassCard';
import XPBar from '@/components/XPBar';
import TaskItem from '@/components/TaskItem';
import BadgeItem from '@/components/BadgeItem';
import { tasks as initialTasks, badges, currentUser } from '@/data/mockData';

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const [taskList, setTaskList] = useState(initialTasks);
  const [filter, setFilter] = useState<'all' | 'daily' | 'weekly' | 'special'>('all');
  const [claimedReward, setClaimedReward] = useState(false);

  const completedCount = taskList.filter((t) => t.completed).length;
  const totalXp = taskList.filter((t) => t.completed).reduce((sum, t) => sum + t.xpReward, 0);

  const toggleTask = (id: string) => {
    setTaskList((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const filteredTasks = filter === 'all' ? taskList : taskList.filter((t) => t.category === filter);

  const handleClaim = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setClaimedReward(true);
    setTimeout(() => setClaimedReward(false), 2000);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0) }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Missions</Text>

        <GlassCard>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressLabel}>DAILY PROGRESS</Text>
              <Text style={styles.progressCount}>{completedCount}/{taskList.length} completed</Text>
            </View>
            <View style={styles.xpEarned}>
              <Feather name="zap" size={16} color={Colors.dark.accent} />
              <Text style={styles.xpEarnedText}>{totalXp} XP</Text>
            </View>
          </View>
          <XPBar current={completedCount} max={taskList.length} level={currentUser.level} showLabel={false} height={6} />
        </GlassCard>

        <View style={styles.filterRow}>
          {(['all', 'daily', 'weekly', 'special'] as const).map((f) => (
            <Pressable
              key={f}
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
              onPress={() => {
                setFilter(f);
                Haptics.selectionAsync();
              }}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.taskList}>
          {filteredTasks.map((task, index) => (
            <Animated.View key={task.id} entering={FadeIn.delay(index * 60).duration(300)}>
              <TaskItem task={task} onToggle={toggleTask} />
            </Animated.View>
          ))}
        </View>

        {completedCount > 0 && (
          <Pressable
            style={({ pressed }) => [
              styles.claimBtn,
              claimedReward && styles.claimBtnClaimed,
              pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            ]}
            onPress={handleClaim}
            disabled={claimedReward}
          >
            <Feather name={claimedReward ? 'check' : 'gift'} size={20} color="#FFF" />
            <Text style={styles.claimBtnText}>
              {claimedReward ? 'REWARD CLAIMED!' : 'CLAIM REWARD'}
            </Text>
          </Pressable>
        )}

        <View style={styles.badgesSection}>
          <Text style={styles.sectionTitle}>BADGE COLLECTION</Text>
          <View style={styles.badgesGrid}>
            {badges.map((badge) => (
              <BadgeItem key={badge.id} badge={badge} />
            ))}
          </View>
        </View>
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
  screenTitle: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 28,
    color: Colors.dark.text,
    letterSpacing: 1,
    paddingTop: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  progressLabel: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 11,
    color: Colors.dark.textTertiary,
    letterSpacing: 2,
  },
  progressCount: {
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 14,
    color: Colors.dark.text,
    marginTop: 2,
  },
  xpEarned: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.accentDim,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  xpEarnedText: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 14,
    color: Colors.dark.accent,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.glassBorder,
  },
  filterBtnActive: {
    backgroundColor: Colors.dark.accentDim,
    borderColor: Colors.dark.accent + '40',
  },
  filterText: {
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 11,
    color: Colors.dark.textTertiary,
    letterSpacing: 1,
  },
  filterTextActive: {
    color: Colors.dark.accent,
  },
  taskList: {
    gap: 8,
  },
  claimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.accent,
    borderRadius: 14,
    height: 52,
    gap: 8,
  },
  claimBtnClaimed: {
    backgroundColor: Colors.dark.success,
  },
  claimBtnText: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 15,
    color: '#FFF',
    letterSpacing: 2,
  },
  badgesSection: {
    marginTop: 4,
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
});
