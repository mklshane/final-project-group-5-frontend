import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import type { DebtRecord } from '@/types/finance';

interface OwedEntryCardProps {
  debt: DebtRecord;
  formatCurrency: (amount: number) => string;
  onPressDetails: (debt: DebtRecord) => void;
  onEdit: (debt: DebtRecord) => void;
  onDelete: (debt: DebtRecord) => void;
}

const debtAmounts = (debt: DebtRecord) => {
  const total = Number.isFinite(debt.total_amount) ? debt.total_amount : debt.amount ?? 0;
  const collected = Number.isFinite(debt.amount_paid) ? debt.amount_paid : 0;
  const remaining = Math.max(0, total - collected);
  return { total, collected, remaining };
};

export function OwedEntryCard({ debt, formatCurrency, onPressDetails, onEdit, onDelete }: OwedEntryCardProps) {
  const theme = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const { total, collected, remaining } = debtAmounts(debt);
  const progress = total > 0 ? Math.min(1, collected / total) : 0;
  const counterpartyName = debt.counterparty_name ?? debt.person_name ?? 'Unknown';
  const formattedDue = debt.due_date
    ? new Date(debt.due_date + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : null;
  const dueText = formattedDue ? `Expected ${formattedDue}` : 'No expected date';

  return (
    <Pressable
      onPress={() => {
        setMenuOpen(false);
        onPressDetails(debt);
      }}
      style={({ pressed }) => pressed && s.cardPressed}
    >
      <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border}]}>
      <View style={s.headerRow}>
        <View style={s.headerText}>
          <Text style={[s.title, { color: theme.text }]} numberOfLines={1}>
            {counterpartyName}
          </Text>
          <Text style={[s.subtitle, { color: theme.secondary }]} numberOfLines={1}>
            {dueText}
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
                onEdit(debt);
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
                onDelete(debt);
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
        <Text style={[s.amountLabel, { color: theme.secondary }]}>Outstanding Balance</Text>
        <Text style={[s.amountValue, { color: remaining > 0 ? theme.text : theme.green }]}>
          {formatCurrency(remaining)}
        </Text>
      </View>

      <View style={s.progressContainer}>
        <View style={s.progressLabels}>
          <Text style={[s.progressText, { color: theme.secondary }]}>
            Collected {formatCurrency(collected)} of {formatCurrency(total)}
          </Text>
          <Text style={[s.progressPercent, { color: theme.text }]}>
            {Math.round(progress * 100)}%
          </Text>
        </View>
        <View style={[s.progressTrack, { backgroundColor: theme.surfaceDeep }]}>
          <View style={[s.progressFill, { width: `${progress * 100}%`, backgroundColor: theme.isDark ? theme.green : '#3F7D36' }]} />
        </View>
      </View>

      {debt.notes ? (
        <View style={[s.notesContainer, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <Ionicons name="document-text-outline" size={14} color={theme.tertiary} style={s.noteIcon} />
          <Text style={[s.notesText, { color: theme.secondary }]} numberOfLines={2}>
            {debt.notes}
          </Text>
        </View>
      ) : null}
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
    width: 32,
    height: 32,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  menuPanel: {
    position: 'absolute',
    right: 0,
    top: 36,
    borderWidth: 1,
    borderRadius: 14,
    width: 140,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuDivider: {
    height: 1,
    width: '100%',
  },
  amountContainer: {
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  progressContainer: {
    marginBottom: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '500',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  noteIcon: {
    marginRight: 8,
  },
  notesText: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    flex: 1,
  },
});