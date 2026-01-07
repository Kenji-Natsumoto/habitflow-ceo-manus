import React from "react";
import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useColors } from "@/hooks/use-colors";

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  completedCount: number;
  totalCount: number;
}

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 10,
  completedCount,
  totalCount,
}: ProgressRingProps) {
  const colors = useColors();
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View className="items-center justify-center">
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.primary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View className="absolute items-center">
        <Text className="text-3xl font-bold text-foreground">{progress}%</Text>
        <Text className="text-sm text-muted">
          {completedCount}/{totalCount}
        </Text>
      </View>
    </View>
  );
}
