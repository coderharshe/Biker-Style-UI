export const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0, title: 'Novice Rider' },
  { level: 2, xp: 500, title: 'Weekend Cruiser' },
  { level: 3, xp: 1200, title: 'Street Tracker' },
  { level: 4, xp: 2500, title: 'Canyon Carver' },
  { level: 5, xp: 4500, title: 'Road Warrior' },
  { level: 6, xp: 7500, title: 'Highway Ghost' },
  { level: 7, xp: 12000, title: 'Iron Butt' },
  { level: 8, xp: 18000, title: 'Speed Demon' },
  { level: 9, xp: 26000, title: 'Apex Predator' },
  { level: 10, xp: 36000, title: 'Moto Legend' }
];

export function getLevelInfo(currentXp: number) {
  let currentLevel = LEVEL_THRESHOLDS[0];
  let nextLevel = LEVEL_THRESHOLDS[1];

  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (currentXp >= LEVEL_THRESHOLDS[i].xp) {
      currentLevel = LEVEL_THRESHOLDS[i];
      nextLevel = LEVEL_THRESHOLDS[i + 1] || LEVEL_THRESHOLDS[i]; // Cap at max
    } else {
      break;
    }
  }

  return {
    level: currentLevel.level,
    title: currentLevel.title,
    currentXp,
    nextLevelXP: nextLevel.xp > currentLevel.xp ? nextLevel.xp : currentXp,
    progress: nextLevel.xp > currentLevel.xp 
      ? (currentXp - currentLevel.xp) / (nextLevel.xp - currentLevel.xp)
      : 1
  };
}
