import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ConfirmDeleteModal } from '@/components/Base/ConfirmDeleteModal';
import { CategoryEditorModal } from '@/components/Profile/CategoryEditorModal';
import { CategoryListSection } from '@/components/Profile/CategoryListSection';
import { useFinanceData } from '@/context/FinanceDataContext';
import type { CategoryRecord } from '@/types/finance';

export default function ManageCategoriesScreen() {
  const { colorScheme } = useColorScheme();
  const { state, loading, addCategory, updateCategory, deleteCategory } = useFinanceData();
  const [editorVisible, setEditorVisible] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [selectedCategory, setSelectedCategory] = useState<CategoryRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryRecord | null>(null);

  const isDark = colorScheme === 'dark';
  const palette = {
    screenBg: isDark ? '#111410' : '#F4F5E9',
    heading: isDark ? '#EDF0E4' : '#1A1E14',
    sub: isDark ? '#8A8F7C' : '#6B7060',
    addBg: isDark ? '#C8F560' : '#1A1E14',
    addText: isDark ? '#1A1E14' : '#C8F560',
    border: isDark ? '#2C3122' : '#E4E6D6',
    cardBg: isDark ? '#1A1E14' : '#FFFFFF',
  };

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
    if (editorMode === 'create') {
      await addCategory(input);
      return;
    }

    if (!selectedCategory) return;

    await updateCategory({
      id: selectedCategory.id,
      ...input,
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteCategory(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: palette.screenBg }]}> 
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={[s.title, { color: palette.heading }]}>Personalize your categories</Text>
          <Text style={[s.subtitle, { color: palette.sub }]}>Create custom categories with your own icon, color, and type.</Text>
        </View>

        <Pressable onPress={openCreateModal} style={[s.addButton, { backgroundColor: palette.addBg }]}> 
          <Ionicons name="add" size={18} color={palette.addText} />
          <Text style={[s.addLabel, { color: palette.addText }]}>Add New Category</Text>
        </Pressable>

        {loading ? (
          <View style={[s.loadingCard, { borderColor: palette.border, backgroundColor: palette.cardBg }]}>
            <Text style={{ color: palette.sub }}>Loading categories...</Text>
          </View>
        ) : (
          <>
            <CategoryListSection
              title="EXPENSE"
              categories={expenseCategories}
              emptyText="No expense categories yet."
              titleColor={palette.sub}
              onEdit={openEditModal}
              onDelete={setDeleteTarget}
            />

            <CategoryListSection
              title="INCOME"
              categories={incomeCategories}
              emptyText="No income categories yet."
              titleColor={palette.sub}
              onEdit={openEditModal}
              onDelete={setDeleteTarget}
            />

            <CategoryListSection
              title="BOTH"
              categories={bothCategories}
              emptyText="No shared categories yet."
              titleColor={palette.sub}
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
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 28,
  },
  header: {
    marginBottom: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    maxWidth: 340,
  },
  addButton: {
    borderRadius: 14,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
    marginBottom: 20,
  },
  addLabel: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  loadingCard: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
});
