import { StyleSheet, Text, View } from 'react-native';
import type { CategoryRecord } from '@/types/finance';
import { CategoryRow } from '@/components/Profile/CategoryRow';
import { useTheme } from '@/hooks/useTheme';

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
  const theme = useTheme();

  return (
    <View style={[s.section, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
      <View style={s.titleRow}>
        <Text style={[s.title, { color: titleColor }]}>{title}</Text>
        <Text style={[s.count, { color: theme.tertiary }]}>{categories.length}</Text>
      </View>

      {categories.length === 0 ? (
        <View style={[s.emptyWrap, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}> 
          <Text style={[s.empty, { color: titleColor }]}>{emptyText}</Text>
        </View>
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
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  count: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyWrap: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  empty: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.82,
  },
  list: {
    gap: 8,
  },
});
