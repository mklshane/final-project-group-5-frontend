import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import type { DebtRecord } from '@/types/finance';

interface DebtEntryCardProps {
  debt: DebtRecord;
  formatCurrency: (amount: number) => string;
  onPressDetails: (debt: DebtRecord) => void;
  onEdit: (debt: DebtRecord) => void;
  onDelete: (debt: DebtRecord) => void;
}

const debtAmounts = (debt: DebtRecord) => {
  const total = Number.isFinite(debt.total_amount) ? debt.total_amount : debt.amount ?? 0;
  const paid = Number.isFinite(debt.amount_paid) ? debt.amount_paid : 0;
  const remaining = Math.max(0, total - paid);
  return { total, paid, remaining };
};

export function DebtEntryCard({ debt, formatCurrency, onPressDetails, onEdit, onDelete }: DebtEntryCardProps) {
  const theme = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const { total, paid, remaining } = debtAmounts(debt);
  const progress = total > 0 ? Math.min(1, paid / total) : 0;
  const dueText = debt.due_date ? `Due ${debt.due_date}` : 'No due date';
  const counterpartyKind = (debt.counterparty_kind ?? 'person').toUpperCase();

  return (
    <Pressable
      onPress={() => {
        setMenuOpen(false);
        onPressDetails(debt);
      }}
      style={({ pressed }) => [
        s.debtCard,
        {
          backgroundColor: theme.isDark ? '#1F261A' : '#FFFFFF',
          borderColor: theme.isDark ? theme.borderHighlight : '#CDD3BE',
          shadowOpacity: theme.isDark ? 0.34 : 0.16,
        },
        pressed ? { opacity: 0.92 } : null,
      ]}
    >
      <View style={[s.cardRail, { backgroundColor: theme.isDark ? theme.limeDark : '#5A8F45' }]} />

      <View style={s.debtTopRow}>
        <View style={s.debtTitleWrap}>
          <Text style={[s.debtTitle, { color: theme.text }]} numberOfLines={1}>
            {debt.counterparty_name ?? debt.person_name ?? 'Unknown'}
          </Text>
          <Text style={[s.debtMeta, { color: theme.secondary }]} numberOfLines={1}>
            {counterpartyKind} • {dueText}
          </Text>
        </View>

        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            setMenuOpen((prev) => !prev);
          }}
          style={[s.menuButton, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
        >
          <Ionicons name="ellipsis-vertical" size={16} color={theme.secondary} />
        </Pressable>

        {menuOpen ? (
          <View style={[s.menuPanel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                setMenuOpen(false);
                onEdit(debt);
              }}
              style={s.menuItem}
            >
              <Ionicons name="create-outline" size={14} color={theme.text} />
              <Text style={[s.menuItemText, { color: theme.text }]}>Edit</Text>
            </Pressable>
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                setMenuOpen(false);
                onDelete(debt);
              }}
              style={s.menuItem}
            >
              <Ionicons name="trash-outline" size={14} color={theme.red} />
              <Text style={[s.menuItemText, { color: theme.red }]}>Delete</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={s.amountRow}>
        <Text style={[s.amountLabel, { color: theme.secondary }]}>Remaining</Text>
        <Text style={[s.debtRemaining, { color: remaining > 0 ? theme.text : theme.green }]}>
          {formatCurrency(remaining)}
        </Text>
      </View>

      <View style={[s.progressTrack, { backgroundColor: theme.surfaceDeep }]}>
        <View style={[s.progressFill, { width: `${progress * 100}%`, backgroundColor: theme.limeDark }]} />
      </View>

      <View style={s.progressRow}>
        <Text style={[s.debtNumbers, { color: theme.secondary }]}>Paid {formatCurrency(paid)} / {formatCurrency(total)}</Text>
        <Text style={[s.progressPercent, { color: theme.text }]}>{Math.round(progress * 100)}%</Text>
      </View>

      {debt.notes ? (
        <View style={[s.noteWrap, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <Text style={[s.debtNote, { color: theme.secondary }]} numberOfLines={1}>
            {debt.notes}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const s = StyleSheet.create({
  debtCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    marginHorizontal: 1,
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 6,
  },
  cardRail: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  debtTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  debtTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  menuButton: {
    width: 30,
    height: 30,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuPanel: {
    position: 'absolute',
    right: 0,
    top: 34,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 4,
    minWidth: 122,
    zIndex: 30,
    elevation: 6,
  },
  menuItem: {
    height: 34,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuItemText: {
    fontSize: 12,
    fontWeight: '700',
  },
  debtTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  debtMeta: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  amountRow: {
    marginBottom: 7,
  },
  amountLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  debtRemaining: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  debtNumbers: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: '800',
  },
  noteWrap: {
    borderWidth: 1,
    borderRadius: 9,
    marginTop: 8,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  debtNote: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
  },
});
