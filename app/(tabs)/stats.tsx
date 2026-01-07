import React, { useMemo } from "react";
import { ScrollView, Text, View, ActivityIndicator } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { useHabits } from "@/lib/habit-context";
import { useColors } from "@/hooks/use-colors";
import { getWeekDates, getDateString, getCompletionRate } from "@/lib/habits";

export default function StatsScreen() {
  const colors = useColors();
  const { habits, logs, streak, isLoading, getHabitsByCategory } = useHabits();

  const weekDates = useMemo(() => getWeekDates(), []);
  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];

  const weekStats = useMemo(() => {
    return weekDates.map((date) => {
      const dateStr = getDateString(date);
      const log = logs.find((l) => l.date === dateStr);
      const rate = getCompletionRate(log, habits.length);
      return {
        date,
        dateStr,
        rate,
        completedCount: log?.completedHabits.length ?? 0,
      };
    });
  }, [weekDates, logs, habits.length]);

  const weeklyAverage = useMemo(() => {
    const total = weekStats.reduce((sum, s) => sum + s.rate, 0);
    return Math.round(total / weekStats.length);
  }, [weekStats]);

  const categoryStats = useMemo(() => {
    const mindHabits = getHabitsByCategory("mind");
    const businessHabits = getHabitsByCategory("business");

    const today = getDateString(new Date());
    const todayLog = logs.find((l) => l.date === today);

    const mindCompleted = mindHabits.filter(
      (h) => todayLog?.completedHabits.includes(h.id)
    ).length;
    const businessCompleted = businessHabits.filter(
      (h) => todayLog?.completedHabits.includes(h.id)
    ).length;

    return {
      mind: {
        total: mindHabits.length,
        completed: mindCompleted,
        rate: mindHabits.length > 0 ? Math.round((mindCompleted / mindHabits.length) * 100) : 0,
      },
      business: {
        total: businessHabits.length,
        completed: businessCompleted,
        rate: businessHabits.length > 0 ? Math.round((businessCompleted / businessHabits.length) * 100) : 0,
      },
    };
  }, [getHabitsByCategory, logs]);

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
          <Text className="text-3xl font-bold text-foreground">Stats</Text>
          <Text className="text-sm text-muted mt-1">あなたの成長を確認</Text>
        </View>

        {/* Streak Card */}
        <View className="bg-surface rounded-2xl border border-border p-5 mb-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm text-muted mb-1">連続達成</Text>
              <Text className="text-4xl font-bold text-foreground">{streak}日</Text>
            </View>
            <View className="w-16 h-16 rounded-full bg-warning/20 items-center justify-center">
              <MaterialIcons name="local-fire-department" size={32} color={colors.warning} />
            </View>
          </View>
        </View>

        {/* Weekly Average Card */}
        <View className="bg-surface rounded-2xl border border-border p-5 mb-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm text-muted mb-1">週間平均達成率</Text>
              <Text className="text-4xl font-bold text-foreground">{weeklyAverage}%</Text>
            </View>
            <View className="w-16 h-16 rounded-full bg-primary/20 items-center justify-center">
              <MaterialIcons name="insights" size={32} color={colors.primary} />
            </View>
          </View>
        </View>

        {/* Weekly Heatmap */}
        <View className="bg-surface rounded-2xl border border-border p-5 mb-4">
          <Text className="text-base font-semibold text-foreground mb-4">
            今週の達成状況
          </Text>
          <View className="flex-row justify-between">
            {weekStats.map((stat, index) => {
              const isToday = stat.dateStr === getDateString(new Date());
              const bgOpacity = stat.rate / 100;
              return (
                <View key={stat.dateStr} className="items-center">
                  <Text className="text-xs text-muted mb-2">
                    {dayNames[stat.date.getDay()]}
                  </Text>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      backgroundColor:
                        stat.rate > 0
                          ? `rgba(99, 102, 241, ${Math.max(0.2, bgOpacity)})`
                          : colors.border,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: isToday ? 2 : 0,
                      borderColor: colors.primary,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: stat.rate > 50 ? "#fff" : colors.foreground,
                      }}
                    >
                      {stat.date.getDate()}
                    </Text>
                  </View>
                  <Text className="text-xs text-muted mt-1">{stat.rate}%</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Category Stats */}
        <View className="bg-surface rounded-2xl border border-border p-5 mb-4">
          <Text className="text-base font-semibold text-foreground mb-4">
            カテゴリ別達成率（今日）
          </Text>

          {/* Mind */}
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <MaterialIcons name="psychology" size={18} color={colors.primary} />
                <Text className="text-sm font-medium text-foreground ml-2">
                  自己啓発
                </Text>
              </View>
              <Text className="text-sm font-semibold text-foreground">
                {categoryStats.mind.rate}%
              </Text>
            </View>
            <View className="h-2 bg-border rounded-full overflow-hidden">
              <View
                style={{
                  width: `${categoryStats.mind.rate}%`,
                  height: "100%",
                  backgroundColor: colors.primary,
                  borderRadius: 4,
                }}
              />
            </View>
            <Text className="text-xs text-muted mt-1">
              {categoryStats.mind.completed}/{categoryStats.mind.total} 完了
            </Text>
          </View>

          {/* Business */}
          <View>
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <MaterialIcons name="business-center" size={18} color={colors.success} />
                <Text className="text-sm font-medium text-foreground ml-2">
                  実務
                </Text>
              </View>
              <Text className="text-sm font-semibold text-foreground">
                {categoryStats.business.rate}%
              </Text>
            </View>
            <View className="h-2 bg-border rounded-full overflow-hidden">
              <View
                style={{
                  width: `${categoryStats.business.rate}%`,
                  height: "100%",
                  backgroundColor: colors.success,
                  borderRadius: 4,
                }}
              />
            </View>
            <Text className="text-xs text-muted mt-1">
              {categoryStats.business.completed}/{categoryStats.business.total} 完了
            </Text>
          </View>
        </View>

        {/* Motivation */}
        <View className="bg-primary/10 rounded-2xl p-5 mb-4">
          <Text className="text-base font-semibold text-foreground mb-2">
            CEOの心得
          </Text>
          <Text className="text-sm text-muted leading-relaxed">
            「成功は習慣の積み重ね。毎日の小さな行動が、大きな成果を生み出す。」
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
