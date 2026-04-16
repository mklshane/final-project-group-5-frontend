import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WALLET_TYPE_ICONS } from '@/constants/defaultWallets';
import type { WalletRecord } from '@/types/finance';
import { useTheme } from '@/hooks/useTheme';

interface WalletRowProps {
  wallet: WalletRecord & { typeLabel?: string };
  amountLabel: string;
  onEdit: (wallet: WalletRecord) => void;
  onArchive: (wallet: WalletRecord) => void;
}

export function WalletRow({ wallet, amountLabel, onEdit, onArchive }: WalletRowProps) {
  const theme = useTheme();
  const { isDark } = theme;

  const icon = WALLET_TYPE_ICONS[wallet.type] as keyof typeof Ionicons.glyphMap;
  const defaultBg = isDark ? 'rgba(200,245,96,0.18)' : 'rgba(200,245,96,0.28)';
  const defaultText = isDark ? '#C8F560' : '#6E8F1A';
  const iconBg = isDark ? theme.surfaceDeep : 'rgba(155,194,58,0.16)';
  const iconColor = isDark ? theme.lime : theme.limeDark;

  return (
    <View style={[s.row, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[s.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>

      <View style={s.info}>
        <View style={s.topLine}>
          <Text style={[s.name, { color: theme.text }]} numberOfLines={1}>
            {wallet.name}
          </Text>
          {wallet.is_default ? (
            <View style={[s.defaultChip, { backgroundColor: defaultBg }]}>
              <Text style={[s.defaultLabel, { color: defaultText }]}>DEFAULT</Text>
            </View>
          ) : null}
        </View>
        <Text style={[s.meta, { color: theme.secondary }]}>{wallet.typeLabel ?? wallet.type}</Text>
      </View>

      <View style={s.right}>
        <Text style={[s.amount, { color: iconColor }]}>{amountLabel}</Text>
        <View style={s.actions}>
          <Pressable onPress={() => onEdit(wallet)} style={s.actionBtn}>
            <Ionicons name="create-outline" size={18} color={theme.secondary} />
          </Pressable>
          <Pressable onPress={() => onArchive(wallet)} style={s.actionBtn}>
            <Ionicons name="archive-outline" size={18} color="#FF6B6B" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    borderWidth: 1,
    borderRadius: 16,
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
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    maxWidth: 140,
  },
  meta: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  defaultChip: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  defaultLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  right: {
    alignItems: 'flex-end',
    gap: 2,
  },
  amount: {
    fontSize: 14,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },
});
