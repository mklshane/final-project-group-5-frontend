import { Alert } from 'react-native';
import { TransactionCard } from '@/components/Base/TransactionCard';

export interface TransactionListItemTx {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  title: string;
  wallet_id?: string | null;
  category_id: string | null;
  date: string;
  categoryName: string;
  categoryIcon?: string | null;
  categoryColor?: string | null;
  walletName: string;
  relativeDay: string;
}

interface TransactionListItemProps {
  tx: TransactionListItemTx;
  formatCurrency: (amount: number) => string;
  onEditPress: (tx: TransactionListItemTx) => void;
  onDeletePress: (tx: TransactionListItemTx) => void;
}

export function TransactionListItem({ tx, formatCurrency, onEditPress, onDeletePress }: TransactionListItemProps) {
  const amountLabel = `${tx.type === 'income' ? '+' : ''}${formatCurrency(tx.amount)}`;
  const kind = tx.title.toLowerCase().includes('scan') ? 'scan' : tx.type === 'income' ? 'income' : 'expense';

  const handleDelete = () => {
    Alert.alert(
      'Delete transaction?',
      `Delete "${tx.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDeletePress(tx) },
      ],
    );
  };

  return (
    <TransactionCard
      title={tx.title}
      categoryName={`${tx.categoryName} • ${tx.walletName}`}
      categoryIcon={tx.categoryIcon ?? undefined}
      categoryColor={tx.categoryColor ?? undefined}
      amountLabel={amountLabel}
      timeLabel={tx.relativeDay}
      kind={kind}
      onEditPress={() => onEditPress(tx)}
      onDeletePress={handleDelete}
    />
  );
}
