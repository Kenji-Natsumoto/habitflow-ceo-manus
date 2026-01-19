# HabitFlow for CEO コードレビューレポート

**レビュー日**: 2026年1月19日  
**レビュアー**: シニアエンジニア  
**対象バージョン**: 0ca4967d

---

## 総合評価

全体的にクリーンで読みやすいコードベースです。React Native + Expoのベストプラクティスに概ね従っています。ただし、いくつかの改善点が見つかりました。以下に詳細を記載します。

---

## 問題点一覧

| # | 重要度 | カテゴリ | ファイル | 問題概要 |
|---|--------|----------|----------|----------|
| 1 | 高 | 命名 | `habits.ts` | `getTodayString` と `getDateString` の命名が紛らわしい |
| 2 | 高 | セキュリティ | `theme-provider.tsx` | デバッグ用 `console.log` が本番コードに残存 |
| 3 | 中 | 冗長性 | `stats.tsx` | `getDateString(new Date())` の重複呼び出し |
| 4 | 中 | 関数粒度 | `habits.ts` | `calculateStreak` 関数が複数の責務を持つ |
| 5 | 中 | 変数粒度 | `habit-item.tsx` | マジックナンバーの使用 |
| 6 | 低 | 可読性 | `stats.tsx` | ハードコードされた色値 |
| 7 | 低 | 命名 | `settings.tsx` | 空の関数 `onPress={() => {}}` |
| 8 | 低 | 型安全性 | `habits.ts` | `icon` プロパティの型が緩い |

---

## 問題点詳細と修正案

### 問題1: 命名の曖昧さ（重要度: 高）

**ファイル**: `lib/habits.ts` (行128-135)

**問題点**: `getTodayString()` と `getDateString(date)` の2つの関数が存在しますが、命名から機能の違いが明確に伝わりません。両方とも「日付を文字列に変換する」という同じ処理を行っており、片方は「今日」を暗黙的に使用します。

**現在のコード**:
```typescript
export function getTodayString(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

export function getDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}
```

**修正案**:
```typescript
/**
 * 日付をYYYY-MM-DD形式の文字列に変換する
 * @param date 変換する日付（省略時は今日）
 */
export function formatDateToString(date: Date = new Date()): string {
  return date.toISOString().split("T")[0];
}

// 後方互換性のためのエイリアス（非推奨）
/** @deprecated formatDateToString() を使用してください */
export const getTodayString = () => formatDateToString();
/** @deprecated formatDateToString(date) を使用してください */
export const getDateString = formatDateToString;
```

**メリット**:
- 1つの関数に統合され、コードの重複が解消
- 関数名から「フォーマット処理」であることが明確
- デフォルト引数により柔軟性が向上

**デメリット**:
- 既存コードの呼び出し箇所を修正する必要がある
- 後方互換性を維持する場合、一時的にコード量が増える

---

### 問題2: デバッグコードの残存（重要度: 高）

**ファイル**: `lib/theme-provider.tsx` (行71)

**問題点**: 本番環境に `console.log` が残っています。これはパフォーマンスに影響し、ユーザーのコンソールに不要な情報が出力されます。

**現在のコード**:
```typescript
console.log(value, themeVariables)

return (
  <ThemeContext.Provider value={value}>
```

**修正案**:
```typescript
// console.log を削除

return (
  <ThemeContext.Provider value={value}>
```

**メリット**:
- パフォーマンスの微小な改善
- 本番環境でのコンソール出力がクリーンに
- セキュリティ上、内部状態の露出を防止

**デメリット**:
- デバッグ時に再度追加が必要になる可能性（ただし開発時のみ有効にする仕組みを導入すべき）

---

### 問題3: 重複した処理（重要度: 中）

**ファイル**: `app/(tabs)/stats.tsx` (行40, 118)

**問題点**: `getDateString(new Date())` が複数箇所で呼び出されています。同じ値を何度も計算するのは非効率です。

**現在のコード**:
```typescript
// 行40
const today = getDateString(new Date());
const todayLog = logs.find((l) => l.date === today);

// 行118
const isToday = stat.dateStr === getDateString(new Date());
```

**修正案**:
```typescript
// useMemo の外で今日の日付を1回だけ計算
const todayDateString = useMemo(() => getDateString(new Date()), []);

const categoryStats = useMemo(() => {
  // ...
  const todayLog = logs.find((l) => l.date === todayDateString);
  // ...
}, [getHabitsByCategory, logs, todayDateString]);

// 週間ヒートマップ内
const isToday = stat.dateStr === todayDateString;
```

**メリット**:
- 不要な Date オブジェクト生成と文字列変換を削減
- コードの一貫性が向上
- 将来的なバグ（日付が処理中に変わる可能性）を防止

**デメリット**:
- 変数のスコープが広がる
- 日付をまたいでアプリを開き続けた場合、古い日付が表示される可能性（ただし通常は問題にならない）

---

### 問題4: 関数の責務過多（重要度: 中）

**ファイル**: `lib/habits.ts` (行168-193)

**問題点**: `calculateStreak` 関数が「ログのソート」「日付の反復」「達成判定」「カウント」の複数の責務を持っています。

**現在のコード**:
```typescript
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
```

**修正案**:
```typescript
const STREAK_THRESHOLD = 0.5; // 50%以上で達成とみなす
const MAX_STREAK_DAYS = 365;

/**
 * 指定日のログが達成基準を満たしているか判定
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
 * ログをMapに変換して高速検索を可能にする
 */
function createLogMap(logs: HabitLog[]): Map<string, HabitLog> {
  return new Map(logs.map((log) => [log.date, log]));
}

/**
 * 連続達成日数を計算
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
```

**メリット**:
- 各関数が単一責務になり、テストが容易に
- `isDayCompleted` は他の場所でも再利用可能
- Map を使用することで検索が O(1) に改善（現在は O(n)）
- マジックナンバー（0.5, 365）が定数化され意図が明確に

**デメリット**:
- コード量が増加
- 小規模なアプリでは過剰設計に見える可能性

---

### 問題5: マジックナンバー（重要度: 中）

**ファイル**: `components/habit-item.tsx` (行53, 64-72)

**問題点**: サイズや余白の数値がハードコードされており、意図が不明確です。

**現在のコード**:
```typescript
padding: 16,
// ...
width: 44,
height: 44,
borderRadius: 22,
// ...
marginRight: 12,
```

**修正案**:
```typescript
// ファイル先頭に定数を定義
const STYLES = {
  ITEM_PADDING: 16,
  ICON_CONTAINER_SIZE: 44,
  ICON_CONTAINER_RADIUS: 22, // ICON_CONTAINER_SIZE / 2
  ICON_CONTAINER_MARGIN: 12,
  ICON_SIZE_COMPLETED: 24,
  ICON_SIZE_DEFAULT: 22,
} as const;

// 使用箇所
padding: STYLES.ITEM_PADDING,
// ...
width: STYLES.ICON_CONTAINER_SIZE,
height: STYLES.ICON_CONTAINER_SIZE,
borderRadius: STYLES.ICON_CONTAINER_RADIUS,
```

**メリット**:
- 数値の意図が明確になる
- 一箇所の変更で全体に反映
- デザインシステムへの移行が容易

**デメリット**:
- 小規模コンポーネントでは冗長に見える
- 定数ファイルの管理が必要になる可能性

---

### 問題6: ハードコードされた色値（重要度: 低）

**ファイル**: `app/(tabs)/stats.tsx` (行132)

**問題点**: テーマカラーを使用せず、RGB値が直接記述されています。

**現在のコード**:
```typescript
backgroundColor:
  stat.rate > 0
    ? `rgba(99, 102, 241, ${Math.max(0.2, bgOpacity)})`
    : colors.border,
```

**修正案**:
```typescript
// lib/utils.ts に追加
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// 使用箇所
backgroundColor:
  stat.rate > 0
    ? hexToRgba(colors.primary, Math.max(0.2, bgOpacity))
    : colors.border,
```

**メリット**:
- テーマカラーとの一貫性が保たれる
- ダークモード/ライトモード切替時に自動対応
- カラーパレット変更時の修正漏れを防止

**デメリット**:
- ユーティリティ関数の追加が必要
- 若干のパフォーマンスオーバーヘッド

---

### 問題7: 空の関数ハンドラ（重要度: 低）

**ファイル**: `app/(tabs)/settings.tsx` (行211, 217)

**問題点**: `onPress={() => {}}` は何も実行しないのに、ユーザーにはタップ可能に見えます。

**現在のコード**:
```typescript
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
```

**修正案（選択肢A: 未実装を明示）**:
```typescript
<SettingItem
  icon="privacy-tip"
  title="プライバシーポリシー"
  subtitle="準備中"
  // onPress を省略してタップ不可に
/>
```

**修正案（選択肢B: プレースホルダURLを設定）**:
```typescript
const PLACEHOLDER_URLS = {
  privacyPolicy: "https://example.com/privacy", // TODO: 実際のURLに置換
  termsOfService: "https://example.com/terms",  // TODO: 実際のURLに置換
};

<SettingItem
  icon="privacy-tip"
  title="プライバシーポリシー"
  onPress={() => Linking.openURL(PLACEHOLDER_URLS.privacyPolicy)}
/>
```

**メリット**:
- ユーザーの期待と実際の動作が一致
- 未実装機能が明確になる

**デメリット**:
- 選択肢Aの場合、UIの見た目が変わる
- 選択肢Bの場合、ダミーURLへの遷移が発生

---

### 問題8: 型の緩さ（重要度: 低）

**ファイル**: `lib/habits.ts` (行9)

**問題点**: `icon` プロパティが `string` 型で、任意の文字列を受け入れます。

**現在のコード**:
```typescript
export interface Habit {
  id: string;
  name: string;
  description: string;
  icon: string;  // 任意の文字列を許容
  category: HabitCategory;
  isDefault: boolean;
}
```

**修正案**:
```typescript
// 有効なアイコン名を型として定義
export type HabitIconName =
  | "book"
  | "self-improvement"
  | "fitness-center"
  | "school"
  | "edit"
  | "alarm"
  | "trending-up"
  | "groups"
  | "lightbulb"
  | "support-agent"
  | "checklist"
  | "rate-review";

export interface Habit {
  id: string;
  name: string;
  description: string;
  icon: HabitIconName;  // 型安全
  category: HabitCategory;
  isDefault: boolean;
}
```

**メリット**:
- コンパイル時に無効なアイコン名を検出
- IDEの自動補完が効く
- `ICON_MAP` との整合性を保証

**デメリット**:
- カスタム習慣追加時に型の拡張が必要
- 将来アイコンを追加する際の手間が増える

---

## 追加の推奨事項

### 1. エラーハンドリングの強化

`loadHabitState` と `saveHabitState` で `console.error` のみ使用していますが、ユーザーへのフィードバックがありません。

```typescript
// 現在
} catch (error) {
  console.error("Failed to load habit state:", error);
}

// 推奨: エラー状態を返すか、トースト通知を表示
} catch (error) {
  console.error("Failed to load habit state:", error);
  // オプション1: エラー状態を返す
  return { habits: DEFAULT_HABITS, logs: [], streak: 0, error: true };
  // オプション2: グローバルエラーハンドラに通知
  // ErrorReporter.capture(error);
}
```

### 2. テストカバレッジの拡充

現在 `habits.test.ts` のみ存在します。以下のテストを追加することを推奨します：

- `habit-context.tsx` のコンテキスト動作テスト
- `progress-ring.tsx` のスナップショットテスト
- 画面コンポーネントの統合テスト

### 3. アクセシビリティの改善

```typescript
// 現在
<Pressable onPress={handlePress}>

// 推奨
<Pressable
  onPress={handlePress}
  accessibilityRole="checkbox"
  accessibilityState={{ checked: isCompleted }}
  accessibilityLabel={`${habit.name}、${isCompleted ? "完了" : "未完了"}`}
>
```

---

## まとめ

| 重要度 | 件数 | 推奨対応 |
|--------|------|----------|
| 高 | 2件 | 即時修正を推奨 |
| 中 | 3件 | 次回リリースまでに対応 |
| 低 | 3件 | 時間があれば対応 |

最優先で対応すべきは **問題2（console.logの削除）** です。本番環境でのデバッグコード残存はセキュリティとパフォーマンスの両面で問題があります。

次に **問題1（命名の改善）** を対応することで、コードの保守性が向上します。

---

*レポート作成: 2026年1月19日*
