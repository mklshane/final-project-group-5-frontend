import { StyleSheet, Text, View } from 'react-native';
import { WalletPreviewItem } from '@/components/Profile/WalletPreviewItem';
import type { WalletRecord } from '@/types/finance';
import { useTheme } from '@/hooks/useTheme';

interface WalletPreviewSectionProps {
  wallets: Array<WalletRecord & { typeLabel?: string }>;
  formatCurrency: (value: number) => string;
}

export function WalletPreviewSection({ wallets, formatCurrency }: WalletPreviewSectionProps) {
  const theme = useTheme();

  if (wallets.length === 0) {
    return (
      <View style={[s.emptyWrap, { borderColor: theme.border }]}>
        <Text style={[s.emptyText, { color: theme.secondary }]}>No wallets yet. Your General wallet will appear once synced.</Text>
      </View>
    );
  }

  return (
    <View style={s.list}>
      {wallets.map((wallet) => (
        <WalletPreviewItem
          key={wallet.id}
          wallet={wallet}
          amountLabel={formatCurrency(wallet.current_balance)}
        />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  list: {
    gap: 10,
    marginBottom: 12,
  },
  emptyWrap: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
