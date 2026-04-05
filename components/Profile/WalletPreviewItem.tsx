import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { StyleSheet, Text, View } from 'react-native';
import { WALLET_TYPE_ICONS } from '@/constants/defaultWallets';
import type { WalletRecord } from '@/types/finance';

interface WalletPreviewItemProps {
  wallet: WalletRecord & { typeLabel?: string };
  amountLabel: string;
}

export function WalletPreviewItem({ wallet, amountLabel }: WalletPreviewItemProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const icon = WALLET_TYPE_ICONS[wallet.type] as keyof typeof Ionicons.glyphMap;

  const palette = {
    cardBg: isDark ? '#1A1E14' : '#FFFFFF',
    cardBorder: isDark ? '#2C3122' : '#E4E6D6',
    iconBg: isDark ? '#222618' : '#EEF0E2',
    iconColor: isDark ? '#C8F560' : '#1A1E14',
    title: isDark ? '#EDF0E4' : '#1A1E14',
    sub: isDark ? '#8A8F7C' : '#6B7060',
    amount: isDark ? '#C8F560' : '#1A1E14',
    chipBg: isDark ? 'rgba(200,245,96,0.18)' : 'rgba(200,245,96,0.30)',
    chipText: isDark ? '#C8F560' : '#6E8F1A',
  };

  return (
    <View style={[s.card, { backgroundColor: palette.cardBg, borderColor: palette.cardBorder }]}>
      <View style={[s.iconWrap, { backgroundColor: palette.iconBg }]}>
        <Ionicons name={icon} size={18} color={palette.iconColor} />
      </View>

      <View style={s.info}>
        <View style={s.titleRow}>
          <Text style={[s.title, { color: palette.title }]} numberOfLines={1}>
            {wallet.name}
          </Text>
          {wallet.is_default ? (
            <View style={[s.defaultChip, { backgroundColor: palette.chipBg }]}>
              <Text style={[s.defaultChipText, { color: palette.chipText }]}>DEFAULT</Text>
            </View>
          ) : null}
        </View>
        <Text style={[s.sub, { color: palette.sub }]}>{wallet.typeLabel ?? wallet.type}</Text>
      </View>

      <Text style={[s.amount, { color: palette.amount }]}>{amountLabel}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    maxWidth: 150,
  },
  sub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  defaultChip: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  defaultChipText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  amount: {
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 4,
  },
});
