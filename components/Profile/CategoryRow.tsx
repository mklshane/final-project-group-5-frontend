import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { CategoryRecord } from '@/types/finance';
import { useTheme } from '@/hooks/useTheme';

interface CategoryRowProps {
  category: CategoryRecord;
  onEdit: (category: CategoryRecord) => void;
  onDelete: (category: CategoryRecord) => void;
}

export function CategoryRow({ category, onEdit, onDelete }: CategoryRowProps) {
  const theme = useTheme();
  const { isDark } = theme;

  const iconName =
    category.icon && Object.prototype.hasOwnProperty.call(Ionicons.glyphMap, category.icon)
      ? (category.icon as keyof typeof Ionicons.glyphMap)
      : 'apps-outline';

  const iconBg = `${category.color ?? '#6C757D'}1F`;
  const iconColor = category.color ?? (isDark ? '#C8F560' : '#1A1E14');

  return (
    <View style={[s.row, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}> 
      <View style={[s.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={iconName} size={18} color={iconColor} />
      </View>

      <View style={s.info}>
        <Text style={[s.name, { color: theme.text }]} numberOfLines={1}>
          {category.name}
        </Text>
        <View style={[s.badge, { backgroundColor: theme.surfaceDeep, borderColor: theme.borderHighlight }]}> 
          <Text style={[s.badgeText, { color: theme.secondary }]}>{(category.type ?? 'expense').toUpperCase()}</Text>
        </View>
      </View>

      <View style={s.actions}>
        <Pressable onPress={() => onEdit(category)} style={[s.actionBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
          <Ionicons name="create-outline" size={18} color={theme.secondary} />
        </Pressable>
        <Pressable onPress={() => onDelete(category)} style={[s.actionBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
          <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 5,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
});
