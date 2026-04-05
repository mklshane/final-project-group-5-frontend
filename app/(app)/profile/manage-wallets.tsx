import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ConfirmDeleteModal } from '@/components/Base/ConfirmDeleteModal';
import { WalletEditorModal } from '@/components/Profile/WalletEditorModal';
import { WalletListSection } from '@/components/Profile/WalletListSection';
import { useFinanceData } from '@/context/FinanceDataContext';
import { useFinanceSelectors } from '@/hooks/useFinanceSelectors';
import type { WalletRecord, WalletType } from '@/types/finance';

export default function ManageWalletsScreen() {
  const { colorScheme } = useColorScheme();
  const { loading, addWallet, updateWallet, archiveWallet } = useFinanceData();
  const finance = useFinanceSelectors();

  const [editorVisible, setEditorVisible] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [selectedWallet, setSelectedWallet] = useState<WalletRecord | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<WalletRecord | null>(null);

  const isDark = colorScheme === 'dark';
  const palette = {
    screenBg: isDark ? '#111410' : '#F4F5E9',
    heading: isDark ? '#EDF0E4' : '#1A1E14',
    sub: isDark ? '#8A8F7C' : '#6B7060',
    addBg: isDark ? '#C8F560' : '#1A1E14',
    addText: isDark ? '#1A1E14' : '#C8F560',
    border: isDark ? '#2C3122' : '#E4E6D6',
    cardBg: isDark ? '#1A1E14' : '#FFFFFF',
  };

  const wallets = finance.wallets;
  const generalWallets = useMemo(() => wallets.filter((wallet) => wallet.type === 'general'), [wallets]);
  const bankWallets = useMemo(() => wallets.filter((wallet) => wallet.type === 'bank'), [wallets]);
  const ewallets = useMemo(() => wallets.filter((wallet) => wallet.type === 'ewallet'), [wallets]);
  const cashWallets = useMemo(() => wallets.filter((wallet) => wallet.type === 'cash'), [wallets]);

  const openCreateModal = () => {
    setEditorMode('create');
    setSelectedWallet(null);
    setEditorVisible(true);
  };

  const openEditModal = (wallet: WalletRecord) => {
    setEditorMode('edit');
    setSelectedWallet(wallet);
    setEditorVisible(true);
  };

  const handleSave = async (input: {
    name: string;
    type: WalletType;
    institutionName: string | null;
    openingBalance: number;
    currentBalance: number;
    isDefault: boolean;
  }) => {
    if (editorMode === 'create') {
      await addWallet(input);
      return;
    }

    if (!selectedWallet) return;

    await updateWallet({
      id: selectedWallet.id,
      ...input,
    });
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;
    await archiveWallet(archiveTarget.id);
    setArchiveTarget(null);
  };

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: palette.screenBg }]}> 
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={[s.title, { color: palette.heading }]}>Your wallets</Text>
          <Text style={[s.subtitle, { color: palette.sub }]}>Track balances across General, Bank, E-wallet and Cash.</Text>
        </View>

        <View style={[s.balanceCard, { backgroundColor: palette.cardBg, borderColor: palette.border }]}> 
          <Text style={[s.balanceLabel, { color: palette.sub }]}>TOTAL BALANCE</Text>
          <Text style={[s.balanceAmount, { color: palette.heading }]}>{finance.formatCurrency(finance.balances.total)}</Text>
        </View>

        <Pressable onPress={openCreateModal} style={[s.addButton, { backgroundColor: palette.addBg }]}> 
          <Ionicons name="add" size={18} color={palette.addText} />
          <Text style={[s.addLabel, { color: palette.addText }]}>Add Wallet</Text>
        </Pressable>

        {loading ? (
          <View style={[s.loadingCard, { borderColor: palette.border, backgroundColor: palette.cardBg }]}>
            <Text style={{ color: palette.sub }}>Loading wallets...</Text>
          </View>
        ) : (
          <>
            <WalletListSection
              title="GENERAL"
              titleColor={palette.sub}
              wallets={generalWallets}
              emptyText="No general wallet."
              formatCurrency={finance.formatCurrency}
              onEdit={openEditModal}
              onArchive={setArchiveTarget}
            />

            <WalletListSection
              title="BANK"
              titleColor={palette.sub}
              wallets={bankWallets}
              emptyText="No bank wallets yet."
              formatCurrency={finance.formatCurrency}
              onEdit={openEditModal}
              onArchive={setArchiveTarget}
            />

            <WalletListSection
              title="E-WALLET"
              titleColor={palette.sub}
              wallets={ewallets}
              emptyText="No e-wallets yet."
              formatCurrency={finance.formatCurrency}
              onEdit={openEditModal}
              onArchive={setArchiveTarget}
            />

            <WalletListSection
              title="CASH"
              titleColor={palette.sub}
              wallets={cashWallets}
              emptyText="No cash wallets yet."
              formatCurrency={finance.formatCurrency}
              onEdit={openEditModal}
              onArchive={setArchiveTarget}
            />
          </>
        )}
      </ScrollView>

      <WalletEditorModal
        visible={editorVisible}
        mode={editorMode}
        initialWallet={selectedWallet}
        onClose={() => setEditorVisible(false)}
        onSave={handleSave}
      />

      <ConfirmDeleteModal
        visible={Boolean(archiveTarget)}
        title="Archive wallet?"
        message={
          archiveTarget
            ? `Archive \"${archiveTarget.name}\"? Historical transactions remain, but this wallet won't be selectable for new entries.`
            : "Archive this wallet?"
        }
        confirmLabel="Archive"
        onCancel={() => setArchiveTarget(null)}
        onConfirm={() => {
          void handleArchive();
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 28,
  },
  header: {
    marginBottom: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    maxWidth: 340,
  },
  balanceCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  balanceAmount: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  addButton: {
    borderRadius: 14,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
    marginBottom: 20,
  },
  addLabel: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  loadingCard: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
});
