import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { radius, spacing, typeScale } from '@/constants/designSystem';
import { WALLET_TYPE_ICONS } from '@/constants/defaultWallets';
import type { WalletRecord } from '@/types/finance';
import { useTheme } from '@/hooks/useTheme';

interface WalletPreviewItemProps {
  wallet: WalletRecord & { typeLabel?: string };
  amountLabel: string;
}

export function WalletPreviewItem({ wallet, amountLabel }: WalletPreviewItemProps) {
  const theme = useTheme();
  const { isDark } = theme;
  const icon = WALLET_TYPE_ICONS[wallet.type] as keyof typeof Ionicons.glyphMap;

  const chipBg = isDark ? 'rgba(123,228,149,0.18)' : 'rgba(123,228,149,0.24)';
  const chipText = isDark ? theme.lime : theme.limeDark;

  return (
    <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={s.mainRow}>
        <View style={[s.iconWrap, { backgroundColor: isDark ? theme.surfaceDeep : 'rgba(123,228,149,0.16)' }]}> 
          <Ionicons name={icon} size={18} color={isDark ? theme.lime : theme.limeDark} />
        </View>

        <View style={s.info}>
          <View style={s.titleRow}>
            <Text style={[s.title, { color: theme.text }]} numberOfLines={1}>
              {wallet.name}
            </Text>
            {wallet.is_default ? (
              <View style={[s.defaultChip, { backgroundColor: chipBg }]}>
                <Text style={[s.defaultChipText, { color: chipText }]}>DEFAULT</Text>
              </View>
            ) : null}
          </View>
          <Text style={[s.typeText, { color: theme.secondary }]}>{wallet.typeLabel ?? wallet.type}</Text>
        </View>

        <Text style={[s.amount, { color: theme.text }]}>{amountLabel}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm - 2,
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
    gap: spacing.xs + 2,
  },
  title: {
    fontSize: typeScale.body + 1,
    fontWeight: '800',
    maxWidth: 150,
  },
  typeText: {
    fontSize: typeScale.bodySm,
    fontWeight: '500',
    marginTop: 2,
  },
  defaultChip: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm - 1,
    paddingVertical: 2,
  },
  defaultChipText: {
    fontSize: typeScale.caption - 2,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  amount: {
    fontSize: typeScale.body,
    fontWeight: '800',
  },
});
