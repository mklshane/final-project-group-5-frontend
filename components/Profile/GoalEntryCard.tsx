import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import type { GoalRecord } from '@/types/finance';

interface GoalEntryCardProps {
  goal: GoalRecord;
  formatCurrency: (amount: number) => string;
  onPressDetails: (goal: GoalRecord) => void;
  onEdit: (goal: GoalRecord) => void;
  onDelete: (goal: GoalRecord) => void;
}

const goalAmounts = (goal: GoalRecord) => {
  const total = Number.isFinite(goal.target_amount) ? goal.target_amount : 0;
  const saved = Number.isFinite(goal.saved_amount) ? goal.saved_amount : 0;
  const remaining = Math.max(0, total - saved);
  return { total, saved, remaining };
};

export function GoalEntryCard({ goal, formatCurrency, onPressDetails, onEdit, onDelete }: GoalEntryCardProps) {
  const theme = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const { total, saved, remaining } = goalAmounts(goal);
  const progress = total > 0 ? Math.min(1, saved / total) : 0;
  const formattedDeadline = goal.deadline
    ? new Date(goal.deadline + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : null;
  const deadlineText = formattedDeadline ? `Target date: ${formattedDeadline}` : 'No target date';

  return (
    <Pressable
      onPress={() => {
        setMenuOpen(false);
        onPressDetails(goal);
      }}
      style={({ pressed }) => pressed && s.cardPressed}
    >
      <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>  
        <View style={s.headerRow}>
          <View style={s.headerText}>
            <Text style={[s.title, { color: theme.text }]} numberOfLines={1}>
              {goal.title}
            </Text>
            <Text style={[s.subtitle, { color: theme.secondary }]} numberOfLines={1}>
              {deadlineText}
            </Text>
          </View>
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
            style={s.menuBtn}
            hitSlop={8}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={theme.tertiary} />
          </Pressable>
          {menuOpen ? (
            <View style={[s.menuPanel, { backgroundColor: theme.surface, borderColor: theme.borderHighlight, shadowColor: '#000' }]}> 
              <Pressable
                onPress={(event) => {
                  event.stopPropagation();
                  setMenuOpen(false);
                  onEdit(goal);
                }}
                style={s.menuItem}
              >
                <Ionicons name="create-outline" size={16} color={theme.text} />
                <Text style={[s.menuItemText, { color: theme.text }]}>Edit</Text>
              </Pressable>
              <View style={[s.menuDivider, { backgroundColor: theme.border }]} />
              <Pressable
                onPress={(event) => {
                  event.stopPropagation();
                  setMenuOpen(false);
                  onDelete(goal);
                }}
                style={s.menuItem}
              >
                <Ionicons name="trash-outline" size={16} color={theme.red} />
                <Text style={[s.menuItemText, { color: theme.red }]}>Delete</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
        <View style={s.amountContainer}>
          <Text style={[s.amountLabel, { color: theme.secondary }]}>Remaining</Text>
          <Text style={[s.amountValue, { color: remaining > 0 ? theme.text : theme.lime }]}> 
            {formatCurrency(remaining)}
          </Text>
        </View>
        <View style={s.progressContainer}>
          <View style={s.progressLabels}>
            <Text style={[s.progressText, { color: theme.secondary }]}> 
              Saved {formatCurrency(saved)} of {formatCurrency(total)}
            </Text>
            <Text style={[s.progressPercent, { color: theme.text }]}> 
              {Math.round(progress * 100)}%
            </Text>
          </View>
          <View style={[s.progressTrack, { backgroundColor: theme.surfaceDeep }]}> 
            <View style={[s.progressFill, { width: `${progress * 100}%`, backgroundColor: theme.lime }]} />
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
    padding: 18,
    marginBottom: 14,
    elevation: 4,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
    zIndex: 10,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  menuBtn: {
    padding: 4,
    marginLeft: 8,
  },
  menuPanel: {
    position: 'absolute',
    top: 28,
    right: 0,
    minWidth: 110,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 4,
    shadowOpacity: 0.13,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 8,
    zIndex: 100,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 7,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 2,
  },
  menuDivider: {
    height: 1,
    marginVertical: 2,
  },
  amountContainer: {
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  progressContainer: {
    marginBottom: 2,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '500',
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
});
