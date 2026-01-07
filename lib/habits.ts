import AsyncStorage from "@react-native-async-storage/async-storage";

export type HabitCategory = "mind" | "business";

export interface Habit {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: HabitCategory;
  isDefault: boolean;
}

export interface HabitLog {
  date: string; // YYYY-MM-DD
  completedHabits: string[]; // habit ids
}

export interface HabitState {
  habits: Habit[];
  logs: HabitLog[];
  streak: number;
}

export const DEFAULT_HABITS: Habit[] = [
  // Mind (自己啓発) カテゴリ
  {
    id: "reading",
    name: "読書30分",
    description: "ビジネス書・自己啓発書を30分読む",
    icon: "book",
    category: "mind",
    isDefault: true,
  },
  {
    id: "meditation",
    name: "瞑想10分",
    description: "マインドフルネス瞑想で集中力向上",
    icon: "self-improvement",
    category: "mind",
    isDefault: true,
  },
  {
    id: "exercise",
    name: "運動",
    description: "ジョギング、ジム、ストレッチなど",
    icon: "fitness-center",
    category: "mind",
    isDefault: true,
  },
  {
    id: "learning",
    name: "学習",
    description: "新しいスキルの習得、オンライン講座",
    icon: "school",
    category: "mind",
    isDefault: true,
  },
  {
    id: "gratitude",
    name: "感謝日記",
    description: "3つの感謝を書き出す",
    icon: "edit",
    category: "mind",
    isDefault: true,
  },
  {
    id: "early-rise",
    name: "早起き",
    description: "6時前に起床",
    icon: "alarm",
    category: "mind",
    isDefault: true,
  },
  // Business (実務) カテゴリ
  {
    id: "sales-check",
    name: "売上確認",
    description: "日次の売上・KPI確認",
    icon: "trending-up",
    category: "business",
    isDefault: true,
  },
  {
    id: "team-1on1",
    name: "チーム1on1",
    description: "メンバーとの対話時間確保",
    icon: "groups",
    category: "business",
    isDefault: true,
  },
  {
    id: "strategy",
    name: "戦略思考",
    description: "30分の戦略・計画立案時間",
    icon: "lightbulb",
    category: "business",
    isDefault: true,
  },
  {
    id: "customer",
    name: "顧客対応",
    description: "顧客との直接コミュニケーション",
    icon: "support-agent",
    category: "business",
    isDefault: true,
  },
  {
    id: "task-review",
    name: "タスク整理",
    description: "優先順位の見直しとタスク整理",
    icon: "checklist",
    category: "business",
    isDefault: true,
  },
  {
    id: "reflection",
    name: "振り返り",
    description: "1日の振り返りと改善点の記録",
    icon: "rate-review",
    category: "business",
    isDefault: true,
  },
];

const STORAGE_KEY = "habitflow_data";

export function getTodayString(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

export function getDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

export async function loadHabitState(): Promise<HabitState> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data) as HabitState;
      // Ensure all default habits exist
      const existingIds = new Set(parsed.habits.map((h) => h.id));
      const missingDefaults = DEFAULT_HABITS.filter((h) => !existingIds.has(h.id));
      if (missingDefaults.length > 0) {
        parsed.habits = [...parsed.habits, ...missingDefaults];
      }
      return parsed;
    }
  } catch (error) {
    console.error("Failed to load habit state:", error);
  }
  return {
    habits: DEFAULT_HABITS,
    logs: [],
    streak: 0,
  };
}

export async function saveHabitState(state: HabitState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save habit state:", error);
  }
}

export function calculateStreak(logs: HabitLog[], habits: Habit[]): number {
  if (logs.length === 0) return 0;

  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = getDateString(checkDate);

    const log = sortedLogs.find((l) => l.date === dateStr);
    if (log && log.completedHabits.length >= Math.floor(habits.length * 0.5)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return streak;
}

export function getTodayLog(logs: HabitLog[]): HabitLog | undefined {
  const today = getTodayString();
  return logs.find((l) => l.date === today);
}

export function toggleHabitCompletion(
  logs: HabitLog[],
  habitId: string
): HabitLog[] {
  const today = getTodayString();
  const existingLogIndex = logs.findIndex((l) => l.date === today);

  if (existingLogIndex >= 0) {
    const existingLog = logs[existingLogIndex];
    const isCompleted = existingLog.completedHabits.includes(habitId);

    const updatedLog: HabitLog = {
      ...existingLog,
      completedHabits: isCompleted
        ? existingLog.completedHabits.filter((id) => id !== habitId)
        : [...existingLog.completedHabits, habitId],
    };

    const newLogs = [...logs];
    newLogs[existingLogIndex] = updatedLog;
    return newLogs;
  } else {
    return [...logs, { date: today, completedHabits: [habitId] }];
  }
}

export function getWeekDates(): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date);
  }

  return dates;
}

export function getCompletionRate(log: HabitLog | undefined, totalHabits: number): number {
  if (!log || totalHabits === 0) return 0;
  return Math.round((log.completedHabits.length / totalHabits) * 100);
}
