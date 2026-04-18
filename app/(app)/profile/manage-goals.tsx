import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ConfirmDeleteModal } from '@/components/Base/ConfirmDeleteModal';
import { GoalEditorModal } from '@/components/Profile/GoalEditorModal';
import { useFinanceData } from '@/context/FinanceDataContext';
import { useFinanceSelectors } from '@/hooks/useFinanceSelectors';
import { useTheme } from '@/hooks/useTheme';
import { useRouter } from 'expo-router';
import { GoalEntryCard } from '@/components/Profile/GoalEntryCard';
import type { GoalRecord } from '@/types/finance';

const progressPercent = (goal: GoalRecord) => {
  if (!goal.target_amount || goal.target_amount <= 0) return 0;
  return Math.min(100, Math.round((goal.saved_amount / goal.target_amount) * 100));
};

export default function ManageGoalsScreen() {
  const theme = useTheme();
  const { loading, addGoal, updateGoal, deleteGoal } = useFinanceData();
  const finance = useFinanceSelectors();
  const router = useRouter();

  const [editorVisible, setEditorVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<GoalRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GoalRecord | null>(null);

  const activeGoals = useMemo(
    () =>
      finance.goals
        .slice()
        .sort((a, b) => {
          const aProgress = progressPercent(a);
          const bProgress = progressPercent(b);
          if (aProgress !== bProgress) return bProgress - aProgress;
          return a.title.localeCompare(b.title);
        }),
    [finance.goals]
  );

  const totals = useMemo(
    () =>
      activeGoals.reduce(
        (acc, goal) => {
          acc.target += goal.target_amount;
          acc.saved += goal.saved_amount;
          return acc;
        },
        { target: 0, saved: 0 }
      ),
    [activeGoals]
  );

  const openCreate = () => {
    setSelectedGoal(null);
    setEditorVisible(true);
  };

  const openEdit = (goal: GoalRecord) => {
    setSelectedGoal(goal);
    setEditorVisible(true);
  };

  const handleSave = async (input: {
    title: string;
    targetAmount: number;
    savedAmount: number;
    deadline?: string | null;
  }) => {
    if (!selectedGoal) {
      await addGoal(input);
      return;
    }

    await updateGoal({
      id: selectedGoal.id,
      title: input.title,
      targetAmount: input.targetAmount,
      savedAmount: input.savedAmount,
      deadline: input.deadline,
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    setDeleteTarget(null);
    await deleteGoal(targetId);
  };

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={[s.heroCard, { borderColor: theme.border, backgroundColor: theme.surface }]}>
          <Text style={[s.title, { color: theme.text }]}>Goals</Text>
          <Text style={[s.subtitle, { color: theme.secondary }]}>
            Set personal savings goals, track your progress, and stay focused on what you are building toward.
          </Text>

          <View style={s.metricsRow}>
            <View style={[s.metricCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              <Text style={[s.metricLabel, { color: theme.secondary }]}>SAVED</Text>
              <Text style={[s.metricValue, { color: theme.text }]}>{finance.formatCurrency(totals.saved)}</Text>
            </View>
            <View style={[s.metricCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              <Text style={[s.metricLabel, { color: theme.secondary }]}>GOALS</Text>
              <Text style={[s.metricValue, { color: theme.text }]}>{activeGoals.length}</Text>
            </View>
          </View>

          <Pressable
            onPress={openCreate}
            style={[s.addButton, { backgroundColor: theme.isDark ? theme.lime : '#3F7D36' }]}
          >
            <Ionicons name="add" size={18} color={theme.isDark ? theme.bg : '#FFFFFF'} />
            <Text style={[s.addLabel, { color: theme.isDark ? theme.bg : '#FFFFFF' }]}>New Goal</Text>
          </Pressable>
        </View>

        <Text style={[s.sectionTitle, { color: theme.secondary }]}>YOUR GOALS</Text>
        {loading ? (
          <View style={[s.stateCard, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <Text style={[s.stateText, { color: theme.secondary }]}>Loading goals...</Text>
          </View>
        ) : activeGoals.length === 0 ? (
          <View style={[s.stateCard, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <Text style={[s.stateText, { color: theme.secondary }]}>No goals yet. Create your first one to get started.</Text>
          </View>
        ) : (
          activeGoals.map((goal) => (
            <GoalEntryCard
              key={goal.id}
              goal={goal}
              formatCurrency={finance.formatCurrency}
              onPressDetails={(g) => router.push(`/profile/goal-detail/${g.id}`)}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))
        )}
      </ScrollView>

      <GoalEditorModal
        visible={editorVisible}
        initialGoal={selectedGoal}
        onClose={() => setEditorVisible(false)}
        onSave={handleSave}
      />

      <ConfirmDeleteModal
        visible={Boolean(deleteTarget)}
        title="Delete goal?"
        message={deleteTarget ? `Delete "${deleteTarget.title}"?` : 'Delete this goal?'}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => { void handleDelete(); }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 30,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginBottom: 18,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 14,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.9,
    marginBottom: 5,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  addButton: {
    borderRadius: 12,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  addLabel: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 8,
    paddingLeft: 2,
  },
  stateCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  stateText: {
    fontSize: 13,
    fontWeight: '500',
  },
  goalCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  goalInfo: {
    flex: 1,
    marginRight: 12,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  goalMeta: {
    fontSize: 12,
    fontWeight: '500',
  },
  goalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 2,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 17,
    fontWeight: '800',
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
