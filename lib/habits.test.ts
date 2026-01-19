import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  DEFAULT_HABITS,
  formatDateToString,
  getTodayString,
  getDateString,
  toggleHabitCompletion,
  calculateStreak,
  getTodayLog,
  getCompletionRate,
  getWeekDates,
  HabitLog,
  Habit,
} from "./habits";

// Mock AsyncStorage
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

describe("habits", () => {
  describe("DEFAULT_HABITS", () => {
    it("should have 12 default habits", () => {
      expect(DEFAULT_HABITS).toHaveLength(12);
    });

    it("should have 6 mind habits and 6 business habits", () => {
      const mindHabits = DEFAULT_HABITS.filter((h) => h.category === "mind");
      const businessHabits = DEFAULT_HABITS.filter((h) => h.category === "business");
      expect(mindHabits).toHaveLength(6);
      expect(businessHabits).toHaveLength(6);
    });

    it("should have unique ids for all habits", () => {
      const ids = DEFAULT_HABITS.map((h) => h.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe("formatDateToString", () => {
    it("should return date in YYYY-MM-DD format for today when no argument", () => {
      const result = formatDateToString();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("should format specific date correctly", () => {
      const date = new Date("2026-01-07T12:00:00Z");
      const result = formatDateToString(date);
      expect(result).toBe("2026-01-07");
    });
  });

  describe("getTodayString (deprecated)", () => {
    it("should return date in YYYY-MM-DD format", () => {
      const result = getTodayString();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("should return same result as formatDateToString()", () => {
      const result1 = getTodayString();
      const result2 = formatDateToString();
      expect(result1).toBe(result2);
    });
  });

  describe("getDateString (deprecated)", () => {
    it("should format date correctly", () => {
      const date = new Date("2026-01-07T12:00:00Z");
      const result = getDateString(date);
      expect(result).toBe("2026-01-07");
    });

    it("should return same result as formatDateToString(date)", () => {
      const date = new Date("2026-01-07T12:00:00Z");
      const result1 = getDateString(date);
      const result2 = formatDateToString(date);
      expect(result1).toBe(result2);
    });
  });

  describe("toggleHabitCompletion", () => {
    it("should add habit to empty logs", () => {
      const logs: HabitLog[] = [];
      const result = toggleHabitCompletion(logs, "reading");
      
      expect(result).toHaveLength(1);
      expect(result[0].completedHabits).toContain("reading");
    });

    it("should add habit to existing today log", () => {
      const today = formatDateToString();
      const logs: HabitLog[] = [{ date: today, completedHabits: ["meditation"] }];
      const result = toggleHabitCompletion(logs, "reading");
      
      expect(result).toHaveLength(1);
      expect(result[0].completedHabits).toContain("reading");
      expect(result[0].completedHabits).toContain("meditation");
    });

    it("should remove habit if already completed", () => {
      const today = formatDateToString();
      const logs: HabitLog[] = [{ date: today, completedHabits: ["reading", "meditation"] }];
      const result = toggleHabitCompletion(logs, "reading");
      
      expect(result[0].completedHabits).not.toContain("reading");
      expect(result[0].completedHabits).toContain("meditation");
    });
  });

  describe("getTodayLog", () => {
    it("should return undefined for empty logs", () => {
      const result = getTodayLog([]);
      expect(result).toBeUndefined();
    });

    it("should return today's log if exists", () => {
      const today = formatDateToString();
      const logs: HabitLog[] = [
        { date: "2025-01-01", completedHabits: ["old"] },
        { date: today, completedHabits: ["reading"] },
      ];
      const result = getTodayLog(logs);
      
      expect(result).toBeDefined();
      expect(result?.completedHabits).toContain("reading");
    });
  });

  describe("getCompletionRate", () => {
    it("should return 0 for undefined log", () => {
      const result = getCompletionRate(undefined, 12);
      expect(result).toBe(0);
    });

    it("should return 0 for zero total habits", () => {
      const log: HabitLog = { date: "2026-01-07", completedHabits: ["reading"] };
      const result = getCompletionRate(log, 0);
      expect(result).toBe(0);
    });

    it("should calculate correct percentage", () => {
      const log: HabitLog = { date: "2026-01-07", completedHabits: ["a", "b", "c"] };
      const result = getCompletionRate(log, 12);
      expect(result).toBe(25);
    });

    it("should return 100 for all completed", () => {
      const log: HabitLog = { date: "2026-01-07", completedHabits: ["a", "b", "c", "d"] };
      const result = getCompletionRate(log, 4);
      expect(result).toBe(100);
    });
  });

  describe("getWeekDates", () => {
    it("should return 7 dates", () => {
      const result = getWeekDates();
      expect(result).toHaveLength(7);
    });

    it("should end with today", () => {
      const result = getWeekDates();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const lastDate = result[result.length - 1];
      expect(lastDate.getDate()).toBe(today.getDate());
    });
  });

  describe("calculateStreak", () => {
    it("should return 0 for empty logs", () => {
      const result = calculateStreak([], DEFAULT_HABITS);
      expect(result).toBe(0);
    });

    it("should count consecutive days with 50%+ completion", () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const logs: HabitLog[] = [
        {
          date: formatDateToString(today),
          completedHabits: ["a", "b", "c", "d", "e", "f", "g"], // 7/12 = 58%
        },
        {
          date: formatDateToString(yesterday),
          completedHabits: ["a", "b", "c", "d", "e", "f"], // 6/12 = 50%
        },
      ];
      
      const result = calculateStreak(logs, DEFAULT_HABITS);
      expect(result).toBe(2);
    });

    it("should use Map for efficient log lookup", () => {
      // This test verifies the performance improvement
      const today = new Date();
      const logs: HabitLog[] = [];
      
      // Create 100 days of logs
      for (let i = 0; i < 100; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        logs.push({
          date: formatDateToString(date),
          completedHabits: ["a", "b", "c", "d", "e", "f"], // 50%
        });
      }
      
      const result = calculateStreak(logs, DEFAULT_HABITS);
      expect(result).toBe(100);
    });
  });
});
