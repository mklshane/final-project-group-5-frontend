import { StyleSheet, Text, View } from 'react-native';
import type { CategoryRecord } from '@/types/finance';
import { CategoryRow } from '@/components/Profile/CategoryRow';

interface CategoryListSectionProps {
  title: string;
  categories: CategoryRecord[];
  emptyText: string;
  titleColor: string;
  onEdit: (category: CategoryRecord) => void;
  onDelete: (category: CategoryRecord) => void;
}

export function CategoryListSection({
  title,
  categories,
  emptyText,
  titleColor,
  onEdit,
  onDelete,
}: CategoryListSectionProps) {
  return (
    <View style={s.section}>
      <Text style={[s.title, { color: titleColor }]}>{title}</Text>

      {categories.length === 0 ? (
        <Text style={[s.empty, { color: titleColor }]}>{emptyText}</Text>
      ) : (
        <View style={s.list}>
          {categories.map((category) => (
            <CategoryRow key={category.id} category={category} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  empty: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.7,
  },
  list: {
    gap: 10,
  },
});
