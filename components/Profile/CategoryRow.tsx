import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { CategoryRecord } from '@/types/finance';

interface CategoryRowProps {
  category: CategoryRecord;
  onEdit: (category: CategoryRecord) => void;
  onDelete: (category: CategoryRecord) => void;
}

export function CategoryRow({ category, onEdit, onDelete }: CategoryRowProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const iconName =
    category.icon && Object.prototype.hasOwnProperty.call(Ionicons.glyphMap, category.icon)
      ? (category.icon as keyof typeof Ionicons.glyphMap)
      : 'apps-outline';

  const palette = {
    cardBg: isDark ? '#1A1E14' : '#FFFFFF',
    cardBorder: isDark ? '#2C3122' : '#E4E6D6',
    text: isDark ? '#EDF0E4' : '#1A1E14',
    sub: isDark ? '#8A8F7C' : '#6B7060',
    iconBg: `${category.color ?? '#6C757D'}1F`,
    iconColor: category.color ?? (isDark ? '#C8F560' : '#1A1E14'),
    badgeBg: isDark ? '#222618' : '#EEF0E2',
    badgeText: isDark ? '#AEB59A' : '#5D6252',
  };

  return (
    <View style={[s.row, { backgroundColor: palette.cardBg, borderColor: palette.cardBorder }]}>
      <View style={[s.iconWrap, { backgroundColor: palette.iconBg }]}>
        <Ionicons name={iconName} size={18} color={palette.iconColor} />
      </View>

      <View style={s.info}>
        <Text style={[s.name, { color: palette.text }]} numberOfLines={1}>
          {category.name}
        </Text>
        <View style={[s.badge, { backgroundColor: palette.badgeBg }]}>
          <Text style={[s.badgeText, { color: palette.badgeText }]}>{(category.type ?? 'expense').toUpperCase()}</Text>
        </View>
      </View>

      <View style={s.actions}>
        <Pressable onPress={() => onEdit(category)} style={s.actionBtn}>
          <Ionicons name="create-outline" size={18} color={palette.sub} />
        </Pressable>
        <Pressable onPress={() => onDelete(category)} style={s.actionBtn}>
          <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
  },
});
