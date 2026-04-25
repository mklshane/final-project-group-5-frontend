import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WALLET_TYPE_ICONS } from '@/constants/defaultWallets';
import { useTheme } from '@/hooks/useTheme';

type WalletLike = {
  id: string;
  name: string;
  current_balance: number;
  type: string;
};

type WalletsCardProps = {
  wallet: WalletLike;
  formatCurrency: (amount: number) => string;
  index: number;
};

type Palette = {
  cardBg: string;
  border: string;
  iconBg: string;
  amount: string;
  label: string;
  accent: string;
};

function getPalette(index: number, isDark: boolean): Palette {
  const limePalette: Palette = {
    cardBg: '#F7FEE7',
    border: '#BEF264',
    iconBg: 'rgba(101, 163, 13, 0.12)',
    amount: '#1A2E05',
    label: '#3F6212',
    accent: '#65A30D',
  };

  const limePaletteDark: Palette = {
    cardBg: '#182808',
    border: '#2D4A0E',
    iconBg: 'rgba(163, 230, 53, 0.13)',
    amount: '#ECFCCB',
    label: '#A3E635',
    accent: '#84CC16',
  };

  const light: Palette[] = [limePalette, limePalette, limePalette];
  const dark: Palette[] = [limePaletteDark, limePaletteDark, limePaletteDark];

  const palettes = isDark ? dark : light;
  return palettes[index % palettes.length];
}

function CardPattern({ accent }: { accent: string }) {
  return (
    <>
      <View style={[s.ringOuter, { borderColor: accent }]} />
      <View style={[s.ringMid,   { borderColor: accent }]} />
      <View style={[s.ringInner, { borderColor: accent }]} />
    </>
  );
}

export function WalletsCard({ wallet, formatCurrency, index }: WalletsCardProps) {
  const theme = useTheme();
  const palette = getPalette(index, theme.isDark);
  const iconName =
    WALLET_TYPE_ICONS[wallet.type as keyof typeof WALLET_TYPE_ICONS] ??
    'wallet-outline';

  return (
    <View
      style={[
        s.card,
        {
          backgroundColor: palette.cardBg,
          borderColor: palette.border,
          shadowColor: theme.isDark ? '#000' : palette.accent,
        },
      ]}
    >
      <CardPattern accent={palette.accent} />
      <View style={s.topRow}>
        <View style={[s.iconWrap, { backgroundColor: palette.iconBg }]}>
          <Ionicons
            name={iconName as keyof typeof Ionicons.glyphMap}
            size={16}
            color={palette.accent}
          />
        </View>
        <Text style={[s.typeLabel, { color: palette.label }]} numberOfLines={1}>
          {wallet.type.toUpperCase()}
        </Text>
      </View>

      <Text style={[s.amount, { color: palette.amount }]} numberOfLines={1} adjustsFontSizeToFit>
        {formatCurrency(wallet.current_balance)}
      </Text>

      <Text style={[s.name, { color: palette.label }]} numberOfLines={1}>
        {wallet.name}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    width: 164,
    minHeight: 120,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  // Concentric rings — center anchored at top: -10, right: -10
  ringOuter: {
    position: 'absolute',
    width: 140, height: 140, borderRadius: 70,
    borderWidth: 1,
    top: -80, right: -80,
    opacity: 0.10,
  },
  ringMid: {
    position: 'absolute',
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 1,
    top: -58, right: -58,
    opacity: 0.08,
  },
  ringInner: {
    position: 'absolute',
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 1,
    top: -36, right: -36,
    opacity: 0.06,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.9,
  },
  amount: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.45,
    marginBottom: 4,
  },
  name: {
    fontSize: 12,
    fontWeight: '700',
  },
});
