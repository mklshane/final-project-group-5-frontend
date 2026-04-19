import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { WalletsCard } from '@/components/Home/WalletsCard';

type WalletLike = {
  id: string;
  name: string;
  current_balance: number;
  type: string;
};

type AccountsSectionProps = {
  wallets: WalletLike[];
  formatCurrency: (amount: number) => string;
  onPressSeeAll: () => void;
};

export function AccountsSection({ wallets, formatCurrency, onPressSeeAll }: AccountsSectionProps) {
  const theme = useTheme();

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={[s.title, { color: theme.tertiary }]}>ACCOUNTS</Text>
        <Pressable onPress={onPressSeeAll} hitSlop={10}>
          <Text style={[s.link, { color: theme.secondary }]}>See all</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.scrollWrap}
        contentContainerStyle={s.scrollContent}
      >
        {wallets.map((wallet, index) => (
          <WalletsCard
            key={wallet.id}
            wallet={wallet}
            index={index}
            formatCurrency={formatCurrency}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    opacity: 0.9,
  },
  link: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollWrap: {
    marginHorizontal: -24,
  },
  scrollContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
});
