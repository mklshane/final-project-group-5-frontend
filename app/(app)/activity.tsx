import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceData } from '@/context/FinanceDataContext';
import { useFinanceSelectors } from '@/hooks/useFinanceSelectors';
import { useTheme } from '@/hooks/useTheme';
import { QuickActionFab } from '@/components/Base/QuickActionFab';
import { TransactionCard } from '@/components/Base/TransactionCard';
import { ConfirmDeleteModal } from '@/components/Base/ConfirmDeleteModal';
import { TransactionEntryModal } from '@/components/Base/TransactionEntryModal';

type FilterKey = 'all' | 'today' | 'week' | 'month';
type CategoryFilterKey = 'all' | string;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
];

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfWeek = (date: Date) => {
  const d = startOfDay(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
};

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { state, addTransaction, deleteTransaction } = useFinanceData();
  const finance = useFinanceSelectors();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterKey>('all');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [entryMode, setEntryMode] = useState<'expense' | 'income'>('expense');
  const [entryVisible, setEntryVisible] = useState(false);
  const [scanRequestId, setScanRequestId] = useState<number | null>(null);

  const deleteTarget = useMemo(
    () => finance.allTransactions.find((tx) => tx.id === deleteTargetId) ?? null,
    [finance.allTransactions, deleteTargetId]
  );

  const categoryFilters = useMemo(
    () => {
      const uniqueCategories = new Map<string, (typeof state.categories)[number]>();
      for (const category of state.categories
        .filter((category) => !category.deleted_at)
        .slice()
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name))) {
        const key = category.name.trim().toLowerCase();
        if (!uniqueCategories.has(key)) {
          uniqueCategories.set(key, category);
        }
      }
      return [...uniqueCategories.values()];
    },
    [state.categories]
  );

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const dayStart = startOfDay(now);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const weekStart = startOfWeek(now);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const monthStart = startOfMonth(now);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);

    let txs = finance.allTransactionsView;

    if (filter === 'today') {
      txs = txs.filter((tx) => {
        const d = new Date(tx.date);
        return d >= dayStart && d < dayEnd;
      });
    } else if (filter === 'week') {
      txs = txs.filter((tx) => {
        const d = new Date(tx.date);
        return d >= weekStart && d < weekEnd;
      });
    } else if (filter === 'month') {
      txs = txs.filter((tx) => {
        const d = new Date(tx.date);
        return d >= monthStart && d < monthEnd;
      });
    }

    if (categoryFilter !== 'all') {
      txs = txs.filter((tx) => tx.category_id === categoryFilter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      txs = txs.filter((tx) =>
        [tx.title, tx.categoryName, tx.walletName].some((value) => value.toLowerCase().includes(q))
      );
    }

    return txs;
  }, [categoryFilter, finance.allTransactionsView, filter, search]);

  const { spent, earned } = useMemo(() => {
    let spent = 0;
    let earned = 0;
    for (const tx of filteredTransactions) {
      if (tx.type === 'expense') spent += tx.amount;
      else earned += tx.amount;
    }
    return { spent, earned };
  }, [filteredTransactions]);

  const groupedTransactions = useMemo(() => {
    const groups = new Map<string, typeof filteredTransactions>();
    for (const tx of filteredTransactions) {
      const key = tx.relativeDay;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(tx);
    }
    return [...groups.entries()].map(([day, txs]) => ({ day, txs }));
  }, [filteredTransactions]);

  const hasNoSearchMatches = search.trim().length > 0 && filteredTransactions.length === 0;

  const handleQuickScan = () => {
    setEntryMode('expense');
    setScanRequestId(Date.now());
    setEntryVisible(true);
  };
  const handleAddExpense = () => {
    setEntryMode('expense');
    setScanRequestId(null);
    setEntryVisible(true);
  };
  const handleAddIncome = () => {
    setEntryMode('income');
    setScanRequestId(null);
    setEntryVisible(true);
  };
  const handleSubmitEntry = async (input: {
    title: string;
    amount: number;
    type: 'expense' | 'income';
    walletId: string | null;
    categoryId: string | null;
    loggedAt: Date;
  }) => {
    await addTransaction({
      title: input.title,
      amount: input.amount,
      type: input.type,
      walletId: input.walletId,
      categoryId: input.categoryId,
      date: input.loggedAt.toISOString(),
    });
  };
  const requestDelete = (id: string) => setDeleteTargetId(id);
  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    const targetId = deleteTargetId;
    setDeleteTargetId(null);
    await deleteTransaction(targetId);
  };

  return (
    <>
      <View style={[s.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
        {/* Header */}
        <View style={s.header}>
          <Text style={[s.title, { color: theme.text }]}>Activity</Text>
        </View>

        {/* Search bar */}
        <View style={[s.searchWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="search-outline" size={16} color={theme.secondary} style={s.searchIcon} />
          <TextInput
            style={[s.searchInput, { color: theme.text }]}
            placeholder="Search transactions..."
            placeholderTextColor={theme.inputPlaceholder}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={theme.secondary} />
            </Pressable>
          )}
        </View>

        {/* Filter chips */}
        {!hasNoSearchMatches && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.filterRow}
            style={s.filterScroll}
          >
            {FILTERS.map((f) => {
              const active = filter === f.key;
              return (
                <Pressable
                  key={f.key}
                  onPress={() => setFilter(f.key)}
                  style={[
                    s.chip,
                    f.key === 'all' ? s.chipCompact : s.chipWide,
                    {
                      backgroundColor: active ? theme.lime : theme.chipBg,
                      borderColor: active ? theme.lime : theme.chipBorder,
                    },
                  ]}
                >
                  <Text
                    style={[s.chipText, { color: active ? '#1A1E14' : theme.secondary }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}
                  >
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}

            {categoryFilters.map((category) => {
              const active = categoryFilter === category.id;
              return (
                <Pressable
                  key={category.id}
                  onPress={() => setCategoryFilter(active ? 'all' : category.id)}
                  style={[
                    s.chip,
                    s.categoryChip,
                    {
                      backgroundColor: active ? theme.lime : theme.chipBg,
                      borderColor: active ? theme.lime : theme.chipBorder,
                    },
                  ]}
                >
                  <Text
                    style={[s.chipText, { color: active ? '#1A1E14' : theme.secondary }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}
                  >
                    {category.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {/* Spent / Earned summary */}
        {!hasNoSearchMatches && (
          <View style={s.summaryRow}>
            <View style={[s.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[s.summaryLabel, { color: theme.secondary }]}>SPENT</Text>
              <Text style={[s.summaryAmount, { color: theme.text }]}>
                {finance.formatCurrency(spent)}
              </Text>
            </View>
            <View style={[s.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[s.summaryLabel, { color: theme.secondary }]}>EARNED</Text>
              <Text style={[s.summaryAmount, { color: theme.green }]}>
                {finance.formatCurrency(earned)}
              </Text>
            </View>
          </View>
        )}

        {/* Transaction list */}
        {finance.loading ? (
          <View style={s.centeredState}>
            <Text style={[s.stateText, { color: theme.secondary }]}>Loading transactions...</Text>
          </View>
        ) : groupedTransactions.length === 0 ? (
          <View style={s.centeredState}>
            <Text style={[s.stateText, { color: theme.secondary }]}>
              {search.trim() ? 'No transactions match your search.' : 'No transactions yet.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={groupedTransactions}
            keyExtractor={(item) => item.day}
            contentContainerStyle={s.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={s.group}>
                <Text style={[s.groupLabel, { color: theme.tertiary }]}>
                  {item.day.toUpperCase()}
                </Text>
                <View style={s.groupCards}>
                  {item.txs.map((tx) => (
                    <TransactionCard
                      key={tx.id}
                      title={tx.title}
                      categoryName={`${tx.categoryName} • ${tx.walletName}`}
                      categoryIcon={tx.categoryIcon}
                      categoryColor={tx.categoryColor}
                      amountLabel={`${tx.type === 'income' ? '+' : ''}${finance.formatCurrency(tx.amount)}`}
                      timeLabel={tx.relativeDay}
                      kind={
                        tx.title.toLowerCase().includes('scan')
                          ? 'scan'
                          : tx.type === 'income'
                            ? 'income'
                            : 'expense'
                      }
                      onDeletePress={() => requestDelete(tx.id)}
                    />
                  ))}
                </View>
              </View>
            )}
          />
        )}
      </View>

      <ConfirmDeleteModal
        visible={Boolean(deleteTargetId)}
        message={
          deleteTarget
            ? `Delete "${deleteTarget.title}"? This action cannot be undone.`
            : 'Delete this transaction? This action cannot be undone.'
        }
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={() => {
          void confirmDelete();
        }}
      />

      <QuickActionFab
        onQuickScan={handleQuickScan}
        onAddExpense={handleAddExpense}
        onAddIncome={handleAddIncome}
      />

      <TransactionEntryModal
        visible={entryVisible}
        mode={entryMode}
        scanRequestId={scanRequestId}
        wallets={finance.wallets}
        categories={state.categories}
        onClose={() => {
          setEntryVisible(false);
          setScanRequestId(null);
        }}
        onSubmit={handleSubmitEntry}
      />
    </>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 14,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    padding: 0,
  },
  // Filters
  filterScroll: {
    flexGrow: 0,
    height: 60,
    marginBottom: 14,
  },
  filterRow: {
    paddingHorizontal: 24,
    paddingVertical: 6,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    height: 34,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  chipCompact: {
    minWidth: 56,
  },
  chipWide: {
    minWidth: 98,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  categoryChip: {
    minWidth: 86,
    maxWidth: 150,
    paddingHorizontal: 16,
  },
  // Summary
  summaryRow: {
    flexDirection: 'row',
    marginHorizontal: 24,
    gap: 10,
    marginBottom: 18,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  summaryAmount: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  // List
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
    gap: 18,
  },
  group: {
    gap: 8,
  },
  groupLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    opacity: 0.85,
  },
  groupCards: {
    gap: 6,
  },
  // States
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  stateText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
