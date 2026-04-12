import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ConfirmDeleteModal } from '@/components/Base/ConfirmDeleteModal';
import { WalletEditorModal } from '@/components/Profile/WalletEditorModal';
import { WalletListSection } from '@/components/Profile/WalletListSection';
import { useFinanceData } from '@/context/FinanceDataContext';
import { useFinanceSelectors } from '@/hooks/useFinanceSelectors';
import { useTheme } from '@/hooks/useTheme';
import type { WalletRecord, WalletType } from '@/types/finance';

export default function ManageWalletsScreen() {
  const theme = useTheme();
  const { loading, addWallet, updateWallet, archiveWallet } = useFinanceData();
  const finance = useFinanceSelectors();

  const [editorVisible, setEditorVisible] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [selectedWallet, setSelectedWallet] = useState<WalletRecord | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<WalletRecord | null>(null);

  const addBg = theme.isDark ? theme.lime : '#3F7D36';
  const addTextColor = theme.isDark ? theme.bg : '#FFFFFF';

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
    <SafeAreaView style={[s.screen, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={[s.title, { color: theme.text }]}>Your wallets</Text>
          <Text style={[s.subtitle, { color: theme.secondary }]}>Track balances across General, Bank, E-wallet and Cash.</Text>
        </View>

        <View style={[s.balanceCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[s.balanceLabel, { color: theme.secondary }]}>TOTAL BALANCE</Text>
          <Text style={[s.balanceAmount, { color: theme.text }]}>{finance.formatCurrency(finance.balances.total)}</Text>
        </View>

        <Pressable
          onPress={openCreateModal}
          style={[s.addButton, { backgroundColor: addBg, borderColor: addBg }]}
        >
          <Ionicons name="add" size={18} color={addTextColor} />
          <Text style={[s.addLabel, { color: addTextColor }]}>Add Wallet</Text>
        </Pressable>

        {loading ? (
          <View style={[s.loadingCard, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <Text style={{ color: theme.secondary }}>Loading wallets...</Text>
          </View>
        ) : (
          <>
            <WalletListSection
              title="GENERAL"
              titleColor={theme.secondary}
              wallets={generalWallets}
              emptyText="No general wallet."
              formatCurrency={finance.formatCurrency}
              onEdit={openEditModal}
              onArchive={setArchiveTarget}
            />

            <WalletListSection
              title="BANK"
              titleColor={theme.secondary}
              wallets={bankWallets}
              emptyText="No bank wallets yet."
              formatCurrency={finance.formatCurrency}
              onEdit={openEditModal}
              onArchive={setArchiveTarget}
            />

            <WalletListSection
              title="E-WALLET"
              titleColor={theme.secondary}
              wallets={ewallets}
              emptyText="No e-wallets yet."
              formatCurrency={finance.formatCurrency}
              onEdit={openEditModal}
              onArchive={setArchiveTarget}
            />

            <WalletListSection
              title="CASH"
              titleColor={theme.secondary}
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
    borderRadius: 16,
    borderWidth: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
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
