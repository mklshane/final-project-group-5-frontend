import { StyleSheet, Text, View } from 'react-native';
import { WalletRow } from '@/components/Profile/WalletRow';
import type { WalletRecord } from '@/types/finance';

interface WalletListSectionProps {
  title: string;
  titleColor: string;
  wallets: Array<WalletRecord & { typeLabel?: string }>;
  emptyText: string;
  formatCurrency: (value: number) => string;
  onEdit: (wallet: WalletRecord) => void;
  onArchive: (wallet: WalletRecord) => void;
}

export function WalletListSection({
  title,
  titleColor,
  wallets,
  emptyText,
  formatCurrency,
  onEdit,
  onArchive,
}: WalletListSectionProps) {
  return (
    <View style={s.section}>
      <Text style={[s.title, { color: titleColor }]}>{title}</Text>

      {wallets.length === 0 ? (
        <Text style={[s.empty, { color: titleColor }]}>{emptyText}</Text>
      ) : (
        <View style={s.list}>
          {wallets.map((wallet) => (
            <WalletRow
              key={wallet.id}
              wallet={wallet}
              amountLabel={formatCurrency(wallet.current_balance)}
              onEdit={onEdit}
              onArchive={onArchive}
            />
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
  list: {
    gap: 10,
  },
  empty: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.7,
  },
});
