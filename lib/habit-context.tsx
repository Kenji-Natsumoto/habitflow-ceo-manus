import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  Habit,
  HabitLog,
  HabitState,
  loadHabitState,
  saveHabitState,
  toggleHabitCompletion,
  calculateStreak,
  getTodayLog,
  getCompletionRate,
} from "./habits";

interface HabitContextValue {
  habits: Habit[];
  logs: HabitLog[];
  streak: number;
  isLoading: boolean;
  todayLog: HabitLog | undefined;
  todayCompletionRate: number;
  toggleHabit: (habitId: string) => void;
  isHabitCompleted: (habitId: string) => boolean;
  getHabitsByCategory: (category: "mind" | "business") => Habit[];
}

const HabitContext = createContext<HabitContextValue | null>(null);

export function HabitProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<HabitState>({
    habits: [],
    logs: [],
    streak: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHabitState().then((loadedState) => {
      setState(loadedState);
      setIsLoading(false);
    });
  }, []);

  const toggleHabit = useCallback((habitId: string) => {
    setState((prev) => {
      const newLogs = toggleHabitCompletion(prev.logs, habitId);
      const newStreak = calculateStreak(newLogs, prev.habits);
      const newState = { ...prev, logs: newLogs, streak: newStreak };
      saveHabitState(newState);
      return newState;
    });
  }, []);

  const todayLog = getTodayLog(state.logs);
  const todayCompletionRate = getCompletionRate(todayLog, state.habits.length);

  const isHabitCompleted = useCallback(
    (habitId: string) => {
      return todayLog?.completedHabits.includes(habitId) ?? false;
    },
    [todayLog]
  );

  const getHabitsByCategory = useCallback(
    (category: "mind" | "business") => {
      return state.habits.filter((h) => h.category === category);
    },
    [state.habits]
  );

  return (
    <HabitContext.Provider
      value={{
        habits: state.habits,
        logs: state.logs,
        streak: state.streak,
        isLoading,
        todayLog,
        todayCompletionRate,
        toggleHabit,
        isHabitCompleted,
        getHabitsByCategory,
      }}
    >
      {children}
    </HabitContext.Provider>
  );
}

export function useHabits() {
  const context = useContext(HabitContext);
  if (!context) {
    throw new Error("useHabits must be used within a HabitProvider");
  }
  return context;
}
