import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import type { Task } from '@/data/mockData';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
}

export default function TaskItem({ task, onToggle }: TaskItemProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(task.id);
  };

  return (
    <Pressable style={({ pressed }) => [styles.container, pressed && styles.pressed]} onPress={handlePress}>
      <View style={[styles.iconWrap, { backgroundColor: task.completed ? Colors.dark.successDim : Colors.dark.accentDim }]}>
        <Feather
          name={task.icon as any}
          size={18}
          color={task.completed ? Colors.dark.success : Colors.dark.accent}
        />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, task.completed && styles.completedTitle]}>{task.title}</Text>
        <Text style={styles.desc}>{task.description}</Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.xp, task.completed && styles.completedXp]}>+{task.xpReward} XP</Text>
        <View style={[styles.check, task.completed && styles.checked]}>
          {task.completed && <Feather name="check" size={14} color={Colors.dark.background} />}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.glassBorder,
    padding: 14,
    gap: 12,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 15,
    color: Colors.dark.text,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: Colors.dark.textSecondary,
  },
  desc: {
    fontFamily: 'Rajdhani_400Regular',
    fontSize: 12,
    color: Colors.dark.textTertiary,
  },
  right: {
    alignItems: 'flex-end',
    gap: 6,
  },
  xp: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 13,
    color: Colors.dark.accent,
  },
  completedXp: {
    color: Colors.dark.success,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.dark.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checked: {
    backgroundColor: Colors.dark.success,
    borderColor: Colors.dark.success,
  },
});
