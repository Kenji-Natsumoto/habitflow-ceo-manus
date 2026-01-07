import React from "react";
import { ScrollView, Text, View, Pressable, Switch, Linking } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useTheme } from "@/lib/theme-provider";

interface SettingItemProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  iconColor?: string;
}

function SettingItem({
  icon,
  title,
  subtitle,
  onPress,
  rightElement,
  iconColor,
}: SettingItemProps) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          padding: 16,
          backgroundColor: colors.surface,
          borderRadius: 12,
          marginBottom: 8,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          backgroundColor: (iconColor || colors.primary) + "20",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <MaterialIcons
          name={icon}
          size={22}
          color={iconColor || colors.primary}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "500",
            color: colors.foreground,
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{
              fontSize: 13,
              color: colors.muted,
              marginTop: 2,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement || (
        onPress && (
          <MaterialIcons name="chevron-right" size={24} color={colors.muted} />
        )
      )}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const { colorScheme, toggleColorScheme } = useTheme();
  const isDark = colorScheme === "dark";

  return (
    <ScreenContainer>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="pt-4 pb-6">
          <Text className="text-3xl font-bold text-foreground">Settings</Text>
          <Text className="text-sm text-muted mt-1">アプリの設定</Text>
        </View>

        {/* Appearance Section */}
        <Text className="text-sm font-semibold text-muted mb-3 ml-1">
          外観
        </Text>
        <SettingItem
          icon="dark-mode"
          title="ダークモード"
          subtitle={isDark ? "オン" : "オフ"}
          rightElement={
            <Switch
              value={isDark}
              onValueChange={toggleColorScheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          }
        />

        {/* Premium Section */}
        <Text className="text-sm font-semibold text-muted mb-3 ml-1 mt-6">
          プレミアム
        </Text>
        <View
          style={{
            backgroundColor: colors.primary + "15",
            borderRadius: 16,
            padding: 20,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: colors.primary + "30",
          }}
        >
          <View className="flex-row items-center mb-3">
            <MaterialIcons name="workspace-premium" size={28} color={colors.primary} />
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: colors.foreground,
                marginLeft: 8,
              }}
            >
              Premium
            </Text>
          </View>
          <Text
            style={{
              fontSize: 14,
              color: colors.muted,
              lineHeight: 20,
              marginBottom: 16,
            }}
          >
            広告非表示、詳細分析、カスタム習慣無制限などの機能をアンロック
          </Text>
          <Pressable
            style={({ pressed }) => [
              {
                backgroundColor: colors.primary,
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: "center",
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#fff",
              }}
            >
              月額480円でアップグレード
            </Text>
          </Pressable>
          <Text
            style={{
              fontSize: 12,
              color: colors.muted,
              textAlign: "center",
              marginTop: 8,
            }}
          >
            年額3,800円（20%お得）
          </Text>
        </View>

        {/* About Section */}
        <Text className="text-sm font-semibold text-muted mb-3 ml-1 mt-6">
          情報
        </Text>
        <SettingItem
          icon="info"
          title="アプリについて"
          subtitle="バージョン 1.0.0"
        />
        <SettingItem
          icon="privacy-tip"
          title="プライバシーポリシー"
          onPress={() => {}}
        />
        <SettingItem
          icon="description"
          title="利用規約"
          onPress={() => {}}
        />
        <SettingItem
          icon="mail"
          title="お問い合わせ"
          subtitle="support@habitflow.app"
          onPress={() => Linking.openURL("mailto:support@habitflow.app")}
        />

        {/* Footer */}
        <View className="items-center mt-8 mb-4">
          <Text className="text-xs text-muted">HabitFlow for CEO</Text>
          <Text className="text-xs text-muted mt-1">
            経営者のための習慣トラッカー
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
