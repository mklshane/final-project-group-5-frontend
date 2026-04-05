import { useColorScheme } from 'nativewind';
import { StyleSheet, Text, View } from 'react-native';
import { WalletPreviewItem } from '@/components/Profile/WalletPreviewItem';
import type { WalletRecord } from '@/types/finance';

interface WalletPreviewSectionProps {
  wallets: Array<WalletRecord & { typeLabel?: string }>;
  formatCurrency: (value: number) => string;
}

export function WalletPreviewSection({ wallets, formatCurrency }: WalletPreviewSectionProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const palette = {
    emptyBorder: isDark ? '#2C3122' : '#E4E6D6',
    emptyText: isDark ? '#8A8F7C' : '#6B7060',
  };

  if (wallets.length === 0) {
    return (
      <View style={[s.emptyWrap, { borderColor: palette.emptyBorder }]}> 
        <Text style={[s.emptyText, { color: palette.emptyText }]}>No wallets yet. Your General wallet will appear once synced.</Text>
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
