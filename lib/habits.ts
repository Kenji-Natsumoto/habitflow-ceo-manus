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

/**
 * 日付をYYYY-MM-DD形式の文字列に変換する
 * @param date 変換する日付（省略時は今日）
 * @returns YYYY-MM-DD形式の文字列
 */
export function formatDateToString(date: Date = new Date()): string {
  return date.toISOString().split("T")[0];
}

/**
 * @deprecated formatDateToString() を使用してください
 * 後方互換性のためのエイリアス
 */
export function getTodayString(): string {
  return formatDateToString();
}

/**
 * @deprecated formatDateToString(date) を使用してください
 * 後方互換性のためのエイリアス
 */
export function getDateString(date: Date): string {
  return formatDateToString(date);
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

/** 連続達成とみなす達成率の閾値（50%） */
const STREAK_THRESHOLD = 0.5;

/** ストリーク計算の最大遡及日数 */
const MAX_STREAK_DAYS = 365;

/**
 * 指定日のログが達成基準を満たしているか判定
 * @param log 対象日のログ
 * @param totalHabits 習慣の総数
 * @param threshold 達成とみなす閾値（デフォルト: 50%）
 */
function isDayCompleted(
  log: HabitLog | undefined,
  totalHabits: number,
  threshold: number = STREAK_THRESHOLD
): boolean {
  if (!log || totalHabits === 0) return false;
  return log.completedHabits.length >= Math.floor(totalHabits * threshold);
}

/**
 * ログ配列をMapに変換して高速検索を可能にする
 * @param logs ログ配列
 */
function createLogMap(logs: HabitLog[]): Map<string, HabitLog> {
  return new Map(logs.map((log) => [log.date, log]));
}

/**
 * 連続達成日数を計算
 * @param logs 習慣ログの配列
 * @param habits 習慣の配列
 * @returns 連続達成日数
 */
export function calculateStreak(logs: HabitLog[], habits: Habit[]): number {
  if (logs.length === 0) return 0;

  const logMap = createLogMap(logs);
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < MAX_STREAK_DAYS; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = formatDateToString(checkDate);

    const log = logMap.get(dateStr);
    if (isDayCompleted(log, habits.length)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return streak;
}

/**
 * 今日のログを取得
 * @param logs ログ配列
 */
export function getTodayLog(logs: HabitLog[]): HabitLog | undefined {
  const today = formatDateToString();
  return logs.find((l) => l.date === today);
}

/**
 * 習慣の完了状態をトグル
 * @param logs 現在のログ配列
 * @param habitId トグルする習慣のID
 * @returns 更新後のログ配列
 */
export function toggleHabitCompletion(
  logs: HabitLog[],
  habitId: string
): HabitLog[] {
  const today = formatDateToString();
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

/**
 * 過去7日間の日付配列を取得
 * @returns 7日分のDateオブジェクト配列（古い順）
 */
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

/**
 * 達成率を計算
 * @param log 対象日のログ
 * @param totalHabits 習慣の総数
 * @returns 達成率（0-100）
 */
export function getCompletionRate(log: HabitLog | undefined, totalHabits: number): number {
  if (!log || totalHabits === 0) return 0;
  return Math.round((log.completedHabits.length / totalHabits) * 100);
}
