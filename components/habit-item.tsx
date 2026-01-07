import React from "react";
import { View, Text, Pressable, Platform } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";
import { Habit } from "@/lib/habits";

interface HabitItemProps {
  habit: Habit;
  isCompleted: boolean;
  onToggle: () => void;
}

const ICON_MAP: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  "book": "menu-book",
  "self-improvement": "self-improvement",
  "fitness-center": "fitness-center",
  "school": "school",
  "edit": "edit-note",
  "alarm": "alarm",
  "trending-up": "trending-up",
  "groups": "groups",
  "lightbulb": "lightbulb",
  "support-agent": "support-agent",
  "checklist": "checklist",
  "rate-review": "rate-review",
};

export function HabitItem({ habit, isCompleted, onToggle }: HabitItemProps) {
  const colors = useColors();

  const handlePress = () => {
    if (Platform.OS !== "web") {
      if (isCompleted) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
    onToggle();
  };

  const iconName = ICON_MAP[habit.icon] || "check-circle";

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          padding: 16,
          backgroundColor: isCompleted ? colors.primary + "15" : colors.surface,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: isCompleted ? colors.primary : colors.border,
          marginBottom: 8,
          opacity: pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: isCompleted ? colors.primary : colors.border,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        {isCompleted ? (
          <MaterialIcons name="check" size={24} color={colors.background} />
        ) : (
          <MaterialIcons name={iconName} size={22} color={colors.muted} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: colors.foreground,
            marginBottom: 2,
          }}
        >
          {habit.name}
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: colors.muted,
          }}
        >
          {habit.description}
        </Text>
      </View>
      {isCompleted && (
        <MaterialIcons name="check-circle" size={24} color={colors.success} />
      )}
    </Pressable>
  );
}
