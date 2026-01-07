import React from "react";
import { ScrollView, Text, View, ActivityIndicator } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { ProgressRing } from "@/components/progress-ring";
import { HabitItem } from "@/components/habit-item";
import { useHabits } from "@/lib/habit-context";
import { useColors } from "@/hooks/use-colors";

export default function TodayScreen() {
  const colors = useColors();
  const {
    habits,
    isLoading,
    todayLog,
    todayCompletionRate,
    streak,
    toggleHabit,
    isHabitCompleted,
    getHabitsByCategory,
  } = useHabits();

  const completedCount = todayLog?.completedHabits.length ?? 0;
  const mindHabits = getHabitsByCategory("mind");
  const businessHabits = getHabitsByCategory("business");

  const today = new Date();
  const dateOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  };
  const formattedDate = today.toLocaleDateString("ja-JP", dateOptions);

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="pt-4 pb-6">
          <Text className="text-sm text-muted mb-1">{formattedDate}</Text>
          <Text className="text-3xl font-bold text-foreground">Today</Text>
        </View>

        {/* Progress Section */}
        <View className="items-center py-6 mb-6 bg-surface rounded-2xl border border-border">
          <ProgressRing
            progress={todayCompletionRate}
            completedCount={completedCount}
            totalCount={habits.length}
          />
          {streak > 0 && (
            <View className="flex-row items-center mt-4 px-4 py-2 bg-primary/10 rounded-full">
              <MaterialIcons name="local-fire-department" size={20} color={colors.warning} />
              <Text className="text-sm font-semibold text-foreground ml-1">
                {streak}日連続達成中
              </Text>
            </View>
          )}
        </View>

        {/* Mind Category */}
        <View className="mb-6">
          <View className="flex-row items-center mb-3">
            <MaterialIcons name="psychology" size={22} color={colors.primary} />
            <Text className="text-lg font-bold text-foreground ml-2">
              自己啓発
            </Text>
            <Text className="text-sm text-muted ml-2">Mind</Text>
          </View>
          {mindHabits.map((habit) => (
            <HabitItem
              key={habit.id}
              habit={habit}
              isCompleted={isHabitCompleted(habit.id)}
              onToggle={() => toggleHabit(habit.id)}
            />
          ))}
        </View>

        {/* Business Category */}
        <View className="mb-6">
          <View className="flex-row items-center mb-3">
            <MaterialIcons name="business-center" size={22} color={colors.primary} />
            <Text className="text-lg font-bold text-foreground ml-2">
              実務
            </Text>
            <Text className="text-sm text-muted ml-2">Business</Text>
          </View>
          {businessHabits.map((habit) => (
            <HabitItem
              key={habit.id}
              habit={habit}
              isCompleted={isHabitCompleted(habit.id)}
              onToggle={() => toggleHabit(habit.id)}
            />
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
