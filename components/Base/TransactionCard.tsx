import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

type TransactionKind = 'income' | 'expense' | 'scan';

interface TransactionCardProps {
  title: string;
  categoryName: string;
  categoryIcon?: string;
  categoryColor?: string;
  amountLabel: string;
  timeLabel: string;
  kind: TransactionKind;
  onDeletePress?: () => void;
}

export function TransactionCard({
  title,
  categoryName,
  categoryIcon,
  categoryColor,
  amountLabel,
  timeLabel,
  kind,
  onDeletePress,
}: TransactionCardProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const swipeRef = useRef<Swipeable | null>(null);

  const palette = {
    cardBg: isDark ? '#1A1E14' : '#FFFFFF',
    cardBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,30,20,0.08)',
    title: isDark ? '#EDF0E4' : '#1A1E14',
    category: isDark ? '#8A8F7C' : '#6B7060',
    time: isDark ? '#585D4C' : '#9DA28F',
    amount: isDark ? '#EDF0E4' : '#1A1E14',
    deleteBg: '#FF6B6B',
  };

  const visual = {
    income: { icon: 'trending-up-outline' as const, iconColor: '#51A351', iconBg: 'rgba(200,245,96,0.24)' },
    expense: { icon: 'wallet-outline' as const, iconColor: '#E68A2E', iconBg: 'rgba(230, 138, 46, 0.12)' },
    scan: { icon: 'scan-circle-outline' as const, iconColor: '#8FAF2B', iconBg: 'rgba(200,245,96,0.22)' },
  }[kind];

  const resolvedIcon =
    categoryIcon && Object.prototype.hasOwnProperty.call(Ionicons.glyphMap, categoryIcon)
      ? (categoryIcon as keyof typeof Ionicons.glyphMap)
      : visual.icon;
  const resolvedIconColor = categoryColor ?? visual.iconColor;
  const resolvedIconBg = categoryColor ? `${categoryColor}1F` : visual.iconBg;

  const CardContent = (
    <View style={[s.card, { backgroundColor: palette.cardBg, borderColor: palette.cardBorder }]}> 
      <View style={[s.iconWrap, { backgroundColor: resolvedIconBg }]}> 
        <Ionicons name={resolvedIcon} size={20} color={resolvedIconColor} />
      </View>

      <View style={s.info}>
        <Text style={[s.title, { color: palette.title }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[s.category, { color: palette.category }]} numberOfLines={1}>
          {categoryName}
        </Text>
      </View>

      <View style={s.right}>
        <Text style={[s.amount, { color: kind === 'income' ? '#51A351' : palette.amount }]}>{amountLabel}</Text>
        <Text style={[s.time, { color: palette.time }]}>{timeLabel}</Text>
      </View>
    </View>
  );

  if (!onDeletePress) return CardContent;

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={() => (
        <Pressable
          style={[s.deleteAction, { backgroundColor: palette.deleteBg }]}
          onPress={() => {
            swipeRef.current?.close();
            onDeletePress();
          }}
        >
          <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
          <Text style={s.deleteLabel}>Delete</Text>
        </Pressable>
      )}
      rightThreshold={26}
      overshootRight={false}
    >
      {CardContent}
    </Swipeable>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  category: {
    fontSize: 12,
    fontWeight: '500',
  },
  right: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  amount: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 3,
  },
  time: {
    fontSize: 11,
    fontWeight: '500',
  },
  deleteAction: {
    width: 84,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    paddingHorizontal: 8,
  },
  deleteLabel: {
    marginTop: 4,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
});
