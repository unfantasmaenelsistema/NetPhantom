export interface LabProgress {
  codename: string;
  userSolved: boolean;
  rootSolved: boolean;
  timeSpentSeconds: number; // accumulated seconds in lab
  completedAt?: string;
  points: number;
}

export interface UserStats {
  totalXp: number;
  level: number;
  levelTitle: string;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
  totalTimeSpentSeconds: number;
  completedLabsCount: number;
  totalLabsCount: number;
}

const STORAGE_KEY_PROGRESS = 'netphantom_user_progress';
const STORAGE_KEY_TIMES = 'netphantom_lab_times';

export const LEVEL_TIERS = [
  { level: 1, minXp: 0, maxXp: 150, title: 'Recluta Novato' },
  { level: 2, minXp: 150, maxXp: 350, title: 'Analista de Seguridad' },
  { level: 3, minXp: 350, maxXp: 650, title: 'Junior Pentester' },
  { level: 4, minXp: 650, maxXp: 1050, title: 'Auditor Ofensivo' },
  { level: 5, minXp: 1050, maxXp: 1600, title: 'Red Team Operator' },
  { level: 6, minXp: 1600, maxXp: 2300, title: 'Exploit Architect' },
  { level: 7, minXp: 2300, maxXp: 99999, title: 'Fantasma del Sistema' },
];

export function getSavedProgress(): Record<string, LabProgress> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROGRESS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveProgress(progress: Record<string, LabProgress>): void {
  try {
    localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progress));
  } catch (e) {
    console.warn('Could not save progress to localStorage:', e);
  }
}

export function getSavedLabTimes(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TIMES);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLabTimes(times: Record<string, number>): void {
  try {
    localStorage.setItem(STORAGE_KEY_TIMES, JSON.stringify(times));
  } catch (e) {
    console.warn('Could not save lab times to localStorage:', e);
  }
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0 min 00 s';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs} h ${mins} min ${secs} s`;
  }
  return `${mins} min ${secs < 10 ? '0' : ''}${secs} s`;
}

export function calculateUserStats(
  progressMap: Record<string, LabProgress>,
  totalLabsCount: number
): UserStats {
  let totalXp = 0;
  let totalTimeSpentSeconds = 0;
  let completedLabsCount = 0;

  Object.values(progressMap).forEach((lab) => {
    let labXp = 0;
    if (lab.userSolved) labXp += 50;
    if (lab.rootSolved) labXp += 100;
    // Practice bonus: 5 XP for every 5 min spent practicing (max 50 bonus per lab)
    const timeBonus = Math.min(50, Math.floor((lab.timeSpentSeconds || 0) / 300) * 5);
    totalXp += labXp + timeBonus;

    totalTimeSpentSeconds += lab.timeSpentSeconds || 0;

    if (lab.userSolved && lab.rootSolved) {
      completedLabsCount += 1;
    }
  });

  // Calculate level tier
  let currentTier = LEVEL_TIERS[0];
  for (let i = 0; i < LEVEL_TIERS.length; i++) {
    if (totalXp >= LEVEL_TIERS[i].minXp) {
      currentTier = LEVEL_TIERS[i];
    } else {
      break;
    }
  }

  const range = currentTier.maxXp - currentTier.minXp;
  const progressInLevel = Math.max(0, totalXp - currentTier.minXp);
  const progressPercent = Math.min(100, Math.round((progressInLevel / (range || 1)) * 100));

  return {
    totalXp,
    level: currentTier.level,
    levelTitle: currentTier.title,
    currentLevelXp: progressInLevel,
    nextLevelXp: range,
    progressPercent,
    totalTimeSpentSeconds,
    completedLabsCount,
    totalLabsCount,
  };
}
