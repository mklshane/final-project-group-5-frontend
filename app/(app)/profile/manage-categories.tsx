import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ConfirmDeleteModal } from '@/components/Base/ConfirmDeleteModal';
import { CategoryEditorModal } from '@/components/Profile/CategoryEditorModal';
import { CategoryListSection } from '@/components/Profile/CategoryListSection';
import { useFinanceData } from '@/context/FinanceDataContext';
import { useToast } from '@/context/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import type { CategoryRecord } from '@/types/finance';

export default function ManageCategoriesScreen() {
  const theme = useTheme();
  const { state, loading, addCategory, updateCategory, deleteCategory } = useFinanceData();
  const toast = useToast();
  const [editorVisible, setEditorVisible] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [selectedCategory, setSelectedCategory] = useState<CategoryRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryRecord | null>(null);

  const activeCategories = useMemo(
    () => state.categories.filter((category) => !category.deleted_at),
    [state.categories]
  );

  const sortedCategories = useMemo(
    () =>
      activeCategories.slice().sort((a, b) => {
        const sortDelta = (a.sort_order ?? 0) - (b.sort_order ?? 0);
        if (sortDelta !== 0) return sortDelta;
        return a.name.localeCompare(b.name);
      }),
    [activeCategories]
  );

  const expenseCategories = sortedCategories.filter((category) => category.type === 'expense');
  const incomeCategories = sortedCategories.filter((category) => category.type === 'income');
  const bothCategories = sortedCategories.filter((category) => category.type === 'both');
  const customCount = sortedCategories.length;

  const openCreateModal = () => {
    setEditorMode('create');
    setSelectedCategory(null);
    setEditorVisible(true);
  };

  const openEditModal = (category: CategoryRecord) => {
    setEditorMode('edit');
    setSelectedCategory(category);
    setEditorVisible(true);
  };

  const handleSave = async (input: {
    name: string;
    icon: string;
    color: string;
    type: 'expense' | 'income' | 'both';
  }) => {
    try {
      if (editorMode === 'create') {
        await addCategory(input);
        toast.show('Category created', 'success');
        return;
      }
      if (!selectedCategory) return;
      await updateCategory({ id: selectedCategory.id, ...input });
      toast.show('Category updated', 'success');
    } catch {
      toast.show('Failed to save category', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCategory(deleteTarget.id);
      toast.show('Category deleted', 'success');
    } catch {
      toast.show('Failed to delete category', 'error');
    }
    setDeleteTarget(null);
  };

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={[s.heroCard, { borderColor: theme.border, backgroundColor: theme.surface }]}>
          <Text style={[s.title, { color: theme.text }]}>Categories</Text>
          <Text style={[s.subtitle, { color: theme.secondary }]}>Build a cleaner taxonomy for spending and income analytics.</Text>

          <View style={s.metricsRow}>
            <View style={[s.metricCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              <Text style={[s.metricLabel, { color: theme.secondary }]}>TOTAL</Text>
              <Text style={[s.metricValue, { color: theme.text }]}>{customCount}</Text>
            </View>
            <View style={[s.metricCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              <Text style={[s.metricLabel, { color: theme.secondary }]}>EXPENSE</Text>
              <Text style={[s.metricValue, { color: theme.text }]}>{expenseCategories.length}</Text>
            </View>
            <View style={[s.metricCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              <Text style={[s.metricLabel, { color: theme.secondary }]}>INCOME</Text>
              <Text style={[s.metricValue, { color: theme.text }]}>{incomeCategories.length}</Text>
            </View>
          </View>

          <Pressable onPress={openCreateModal} style={[s.addButton, { backgroundColor: theme.isDark ? theme.lime : '#3F7D36' }]}>
            <Ionicons name="add" size={18} color={theme.isDark ? theme.bg : '#FFFFFF'} />
            <Text style={[s.addLabel, { color: theme.isDark ? theme.bg : '#FFFFFF' }]}>Add New Category</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={[s.loadingCard, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <Text style={{ color: theme.secondary }}>Loading categories...</Text>
          </View>
        ) : (
          <>
            <CategoryListSection
              title="EXPENSE"
              categories={expenseCategories}
              emptyText="No expense categories yet."
              titleColor={theme.secondary}
              onEdit={openEditModal}
              onDelete={setDeleteTarget}
            />

            <CategoryListSection
              title="INCOME"
              categories={incomeCategories}
              emptyText="No income categories yet."
              titleColor={theme.secondary}
              onEdit={openEditModal}
              onDelete={setDeleteTarget}
            />

            <CategoryListSection
              title="BOTH"
              categories={bothCategories}
              emptyText="No shared categories yet."
              titleColor={theme.secondary}
              onEdit={openEditModal}
              onDelete={setDeleteTarget}
            />
          </>
        )}
      </ScrollView>

      <CategoryEditorModal
        visible={editorVisible}
        mode={editorMode}
        initialCategory={selectedCategory}
        onClose={() => setEditorVisible(false)}
        onSave={handleSave}
      />

      <ConfirmDeleteModal
        visible={Boolean(deleteTarget)}
        title="Delete category?"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.name}"? Existing transactions will remain but may appear as uncategorized.`
            : 'Delete this category? Existing transactions will remain but may appear as uncategorized.'
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          void handleDelete();
        }}
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
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
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
  loadingCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
});
