import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import type { GoalRecord } from '@/types/finance';

interface GoalSummaryCardProps {
  goal: GoalRecord;
  formatCurrency: (amount: number) => string;
  onPress?: () => void;
}

const toTimelineLabel = (deadline: string | null | undefined) => {
  if (!deadline) return 'No target date';

  const parsed = new Date(`${deadline}T00:00:00`);
  if (!Number.isFinite(parsed.getTime())) return 'No target date';

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.ceil((parsed.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000));

  if (diffDays > 0) return `${diffDays} day${diffDays === 1 ? '' : 's'} to go`;
  if (diffDays === 0) return 'Due today';
  const overdueDays = Math.abs(diffDays);
  return `${overdueDays} day${overdueDays === 1 ? '' : 's'} overdue`;
};

export function GoalSummaryCard({ goal, formatCurrency, onPress }: GoalSummaryCardProps) {
  const theme = useTheme();

  const total = Number.isFinite(goal.target_amount) ? goal.target_amount : 0;
  const saved = Number.isFinite(goal.saved_amount) ? goal.saved_amount : 0;
  const progress = total > 0 ? Math.min(1, saved / total) : 0;
  const remaining = Math.max(0, total - saved);

  const accentColor = theme.isDark ? theme.lime : '#3F7D36';
  const accentBg = theme.isDark ? 'rgba(200, 245, 96, 0.10)' : 'rgba(63, 125, 54, 0.10)';

  return (
    <Pressable
      style={({ pressed }) => pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }}
      onPress={onPress}
    >
      <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
        <View style={s.topRow}>
          <View style={[s.iconWrap, { backgroundColor: accentBg }]}> 
            <Ionicons name="flag-outline" size={18} color={accentColor} />
          </View>

          <View style={s.info}>
            <Text style={[s.title, { color: theme.text }]} numberOfLines={1}>
              {goal.title}
            </Text>
            <Text style={[s.subtitle, { color: theme.tertiary }]} numberOfLines={1}>
              {toTimelineLabel(goal.deadline)}
            </Text>
          </View>

          <Text style={[s.amount, { color: remaining > 0 ? theme.text : accentColor }]}>
            {formatCurrency(remaining)}
          </Text>
        </View>

        <View style={s.progressContainer}>
          <View style={[s.progressTrack, { backgroundColor: theme.surfaceDeep }]}> 
            <View
              style={[
                s.progressFill,
                { backgroundColor: accentColor, width: `${Math.round(progress * 100)}%` },
              ]}
            />
          </View>
          <View style={s.progressLabelRow}>
            <Text style={[s.progressLabel, { color: theme.tertiary }]}>
              {formatCurrency(saved)} saved
            </Text>
            <Text style={[s.progressLabel, { color: theme.tertiary }]}>
              of {formatCurrency(total)}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  amount: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  progressContainer: {
    width: '100%',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
});
