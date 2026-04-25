import { useMemo, useState } from 'react';
import {
  Alert,
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
import { useToast } from '@/context/ToastContext';
import { useFinanceSelectors } from '@/hooks/useFinanceSelectors';
import { useTheme } from '@/hooks/useTheme';
import { QuickActionFab } from '@/components/Base/QuickActionFab';
import { TransactionCard } from '@/components/Base/TransactionCard';
import { TransactionEntryModal } from '@/components/Base/TransactionEntryModal';

type FilterKey = 'all' | 'today' | 'week' | 'month';
type TypeFilterKey = 'all' | 'expense' | 'income';
type CategoryFilterKey = 'all' | string;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
];

const TYPE_FILTERS: { key: TypeFilterKey; label: string }[] = [
  { key: 'all', label: 'All types' },
  { key: 'expense', label: 'Expense' },
  { key: 'income', label: 'Income' },
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

const toIoniconName = (icon: string | null | undefined): keyof typeof Ionicons.glyphMap => {
  if (icon && Object.prototype.hasOwnProperty.call(Ionicons.glyphMap, icon)) {
    return icon as keyof typeof Ionicons.glyphMap;
  }
  return 'pricetag-outline';
};

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { state, addTransaction, deleteTransaction } = useFinanceData();
  const toast = useToast();
  const finance = useFinanceSelectors();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilterKey>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterKey>('all');
  const [filterPanelVisible, setFilterPanelVisible] = useState(false);
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [entryMode, setEntryMode] = useState<'expense' | 'income'>('expense');
  const [entryVisible, setEntryVisible] = useState(false);
  const [scanRequestId, setScanRequestId] = useState<number | null>(null);


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

    if (typeFilter !== 'all') {
      txs = txs.filter((tx) => tx.type === typeFilter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      txs = txs.filter((tx) =>
        [tx.title, tx.categoryName, tx.walletName].some((value) => value.toLowerCase().includes(q))
      );
    }

    return txs;
  }, [categoryFilter, finance.allTransactionsView, filter, search, typeFilter]);

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
  const activeCategory =
    categoryFilter === 'all'
      ? null
      : categoryFilters.find((item) => item.id === categoryFilter) ?? null;
  const activeCategoryLabel =
    activeCategory?.name ?? 'All';
  const activeCategoryIcon = toIoniconName(activeCategory?.icon);
  const activeCategoryColor = activeCategory?.color ?? theme.tertiary;
  const hasActiveFilters = filter !== 'all' || typeFilter !== 'all' || categoryFilter !== 'all';
  const activeFilterCount = (filter !== 'all' ? 1 : 0) + (typeFilter !== 'all' ? 1 : 0) + (categoryFilter !== 'all' ? 1 : 0);

  const resetFilters = () => {
    setFilter('all');
    setTypeFilter('all');
    setCategoryFilter('all');
    setCategoryMenuVisible(false);
  };

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
  const requestDelete = (id: string) => {
    const target = finance.allTransactions.find((tx) => tx.id === id);
    Alert.alert(
      'Delete transaction?',
      target ? `Delete "${target.title}"? This action cannot be undone.` : 'Delete this transaction? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => void confirmDelete(id) },
      ],
    );
  };
  const confirmDelete = async (id: string) => {
    try {
      await deleteTransaction(id);
      toast.show('Transaction deleted', 'success');
    } catch {
      toast.show('Failed to delete transaction', 'error');
    }
  };

  return (
    <>
      <View style={[s.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerRow}>
            <View>
              <Text style={[s.title, { color: theme.text }]}>Activity</Text>
            </View>
          </View>
        </View>

        <View style={s.topPanel}>
          <View style={s.topRow}>
            {/* Search bar */}
            <View style={[s.searchWrap, { backgroundColor: theme.isDark ? theme.surfaceAlt : theme.inputBg, borderColor: theme.inputBorder }]}> 
              <View style={[s.searchIconWrap, { backgroundColor: theme.isDark ? theme.surfaceDeep : theme.surface }]}> 
                <Ionicons name="search-outline" size={14} color={theme.secondary} />
              </View>
              <TextInput
                style={[s.searchInput, { color: theme.text }]}
                placeholder="Search title, category, wallet"
                placeholderTextColor={theme.inputPlaceholder}
                value={search}
                onChangeText={setSearch}
                returnKeyType="search"
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')} hitSlop={8} style={s.searchClearBtn}>
                  <Ionicons name="close" size={14} color={theme.secondary} />
                </Pressable>
              )}
            </View>

            <Pressable
              onPress={() => {
                setFilterPanelVisible((current) => {
                  const next = !current;
                  if (!next) setCategoryMenuVisible(false);
                  return next;
                });
              }}
              style={[
                s.filterToggle,
                {
                  backgroundColor: filterPanelVisible ? (theme.isDark ? theme.surfaceDeep : theme.chipBg) : theme.surface,
                  borderColor: filterPanelVisible || hasActiveFilters ? theme.limeDark : theme.border,
                },
              ]}
            >
              <Ionicons name="options-outline" size={16} color={filterPanelVisible || hasActiveFilters ? theme.limeDark : theme.secondary} />
              {activeFilterCount > 0 && (
                <View style={[s.filterBadge, { backgroundColor: theme.limeDark }]}>
                  <Text style={s.filterBadgeText}>{activeFilterCount}</Text>
                </View>
              )}
            </Pressable>
          </View>

          {!hasNoSearchMatches && filterPanelVisible && (
            <View style={[s.filtersPanel, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
              <View style={s.filtersPanelHeader}>
                <Text style={[s.filtersPanelTitle, { color: theme.text }]}>Filters</Text>
                {hasActiveFilters ? (
                  <Pressable onPress={resetFilters}>
                    <Text style={[s.filtersClearText, { color: theme.limeDark }]}>Clear all</Text>
                  </Pressable>
                ) : null}
              </View>

              <View style={[s.filterGroup, s.filterSection, { borderBottomColor: theme.border }]}>
                <Text style={[s.filterGroupLabel, { color: theme.tertiary }]}>Period</Text>
                <View style={[s.filterRowShell, { backgroundColor: theme.isDark ? theme.surfaceAlt : theme.surfaceAlt, borderColor: theme.border }]}> 
                  <View style={s.filterRow}>
                    {FILTERS.map((f) => {
                      const active = filter === f.key;
                      return (
                        <Pressable
                          key={f.key}
                          onPress={() => setFilter(f.key)}
                          style={[
                            s.chip,
                            {
                              backgroundColor: active ? theme.lime : 'transparent',
                              borderColor: active ? theme.limeDark : 'transparent',
                            },
                          ]}
                        >
                          <Text style={[s.chipText, { color: active ? '#1A1E14' : theme.secondary }]} numberOfLines={1}>
                            {f.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>

              <View style={[s.filterGroup, s.filterSection, { borderBottomColor: theme.border }]}>
                <Text style={[s.filterGroupLabel, { color: theme.tertiary }]}>Type</Text>
                <View style={[s.filterRowShell, { backgroundColor: theme.isDark ? theme.surfaceAlt : theme.surfaceAlt, borderColor: theme.border }]}> 
                  <View style={s.filterRowType}>
                    {TYPE_FILTERS.map((item) => {
                      const active = typeFilter === item.key;
                      return (
                        <Pressable
                          key={item.key}
                          onPress={() => setTypeFilter(item.key)}
                          style={[
                            s.typeChip,
                            {
                              backgroundColor: active ? theme.lime : 'transparent',
                              borderColor: active ? theme.limeDark : 'transparent',
                            },
                          ]}
                        >
                          <Text style={[s.chipText, { color: active ? '#1A1E14' : theme.secondary }]}>{item.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>

              <View style={s.filterGroup}>
                <Text style={[s.filterGroupLabel, { color: theme.tertiary }]}>Category</Text>
                <View style={s.dropdownWrap}>
                  <Pressable
                    onPress={() => setCategoryMenuVisible((current) => !current)}
                    style={[
                      s.dropdownTrigger,
                      {
                        backgroundColor: theme.isDark ? theme.surfaceAlt : theme.inputBg,
                        borderColor: categoryMenuVisible || categoryFilter !== 'all' ? theme.limeDark : theme.inputBorder,
                      },
                    ]}
                  >
                    <View style={s.dropdownTriggerContent}>
                      <View
                        style={[
                          s.categoryIconWrap,
                          {
                            backgroundColor:
                              categoryFilter === 'all'
                                ? theme.surfaceDeep
                                : `${activeCategoryColor}20`,
                          },
                        ]}
                      >
                        <Ionicons
                          name={categoryFilter === 'all' ? 'layers-outline' : activeCategoryIcon}
                          size={14}
                          color={categoryFilter === 'all' ? theme.tertiary : activeCategoryColor}
                        />
                      </View>
                      <Text style={[s.dropdownTriggerText, { color: theme.text }]} numberOfLines={1}>
                        {activeCategoryLabel}
                      </Text>
                    </View>
                    <Ionicons
                      name={categoryMenuVisible ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={theme.secondary}
                    />
                  </Pressable>

                  {categoryMenuVisible && (
                    <View
                      style={[
                        s.dropdownMenu,
                        {
                          backgroundColor: theme.surface,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <ScrollView
                        showsVerticalScrollIndicator={false}
                        nestedScrollEnabled
                        contentContainerStyle={s.dropdownMenuScrollContent}
                      >
                        <Pressable
                          onPress={() => {
                            setCategoryFilter('all');
                            setCategoryMenuVisible(false);
                          }}
                          style={[
                            s.dropdownMenuItem,
                            categoryFilter === 'all' && {
                              backgroundColor: theme.chipBg,
                            },
                          ]}
                        >
                          <View style={s.dropdownMenuItemContent}>
                            <View style={[s.categoryIconWrap, { backgroundColor: theme.surfaceDeep }]}>
                              <Ionicons name="layers-outline" size={14} color={theme.tertiary} />
                            </View>
                            <Text
                              style={[
                                s.dropdownMenuItemText,
                                { color: categoryFilter === 'all' ? theme.text : theme.secondary },
                              ]}
                            >
                              All Categories
                            </Text>
                          </View>
                          {categoryFilter === 'all' && <Ionicons name="checkmark" size={16} color={theme.lime} />}
                        </Pressable>

                        {categoryFilters.map((category) => {
                          const active = categoryFilter === category.id;
                          const iconName = toIoniconName(category.icon);
                          const iconColor = category.color ?? theme.text;
                          return (
                            <Pressable
                              key={category.id}
                              onPress={() => {
                                setCategoryFilter(category.id);
                                setCategoryMenuVisible(false);
                              }}
                              style={[
                                s.dropdownMenuItem,
                                active && {
                                  backgroundColor: theme.chipBg,
                                },
                              ]}
                            >
                              <View style={s.dropdownMenuItemContent}>
                                <View style={[s.categoryIconWrap, { backgroundColor: `${iconColor}20` }]}>
                                  <Ionicons name={iconName} size={14} color={iconColor} />
                                </View>
                                <Text
                                  style={[
                                    s.dropdownMenuItemText,
                                    { color: active ? theme.text : theme.secondary },
                                  ]}
                                  numberOfLines={1}
                                >
                                  {category.name}
                                </Text>
                              </View>
                              {active && <Ionicons name="checkmark" size={16} color={theme.lime} />}
                            </Pressable>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

        </View>

        {/* Spent / Earned summary */}
        {!hasNoSearchMatches && (
          <View style={s.summaryRow}>
            <View style={[s.summaryCard, { backgroundColor: theme.isDark ? theme.surfaceAlt : '#FAFCF7', borderColor: theme.border }]}> 
              <View style={s.summaryHead}>
                <Text style={[s.summaryLabel, { color: theme.secondary }]}>SPENT</Text>
                <View style={[s.summaryIconWrap, { backgroundColor: theme.isDark ? 'rgba(230,108,106,0.18)' : 'rgba(230,108,106,0.12)' }]}> 
                  <Ionicons name="arrow-down" size={12} color={theme.red} />
                </View>
              </View>
              <Text style={[s.summaryAmount, { color: theme.text }]}> 
                {finance.formatCurrency(spent)}
              </Text>
            </View>
            <View style={[s.summaryCard, { backgroundColor: theme.isDark ? theme.surfaceAlt : '#F7FCF4', borderColor: theme.border }]}> 
              <View style={s.summaryHead}>
                <Text style={[s.summaryLabel, { color: theme.secondary }]}>EARNED</Text>
                <View style={[s.summaryIconWrap, { backgroundColor: theme.isDark ? 'rgba(72,184,108,0.2)' : 'rgba(72,184,108,0.14)' }]}> 
                  <Ionicons name="arrow-up" size={12} color={theme.green} />
                </View>
              </View>
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
                <View style={s.groupHeader}>
                  <Text style={[s.groupLabel, { color: theme.tertiary }]}> 
                    {item.day.toUpperCase()}
                  </Text>
                  <View style={[s.groupDivider, { backgroundColor: theme.border }]} />
                </View>
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  topPanel: {
    marginHorizontal: 20,
    marginBottom: 10,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  // Search
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 10,
  },
  searchIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  filterToggle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: '#162112',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
  searchClearBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    padding: 0,
  },
  // Filters
  filtersPanel: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  filtersPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filtersPanelTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  filtersClearText: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterGroup: {
    gap: 4,
  },
  filterSection: {
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  filterGroupLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    paddingHorizontal: 2,
  },
  filterRowShell: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 3,
  },
  dropdownWrap: {
    position: 'relative',
    zIndex: 20,
    paddingHorizontal: 0,
  },
  dropdownTrigger: {
    minHeight: 38,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  dropdownTriggerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    gap: 10,
  },
  dropdownTriggerText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 48,
    left: 4,
    right: 4,
    maxHeight: 280,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  dropdownMenuScrollContent: {
    paddingVertical: 2,
  },
  dropdownMenuItem: {
    minHeight: 42,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    marginHorizontal: 6,
  },
  dropdownMenuItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 12,
  },
  dropdownMenuItemText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  categoryIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    gap: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterRowType: {
    gap: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    flex: 1,
    height: 32,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  typeChip: {
    flex: 1,
    height: 32,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 11,
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
    marginHorizontal: 20,
    marginBottom: 14,
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  summaryHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  summaryAmount: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  // List
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 20,
  },
  group: {
    gap: 10,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  groupLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    opacity: 0.85,
  },
  groupDivider: {
    height: 1,
    flex: 1,
    opacity: 0.8,
  },
  groupCards: {
    gap: 8,
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
