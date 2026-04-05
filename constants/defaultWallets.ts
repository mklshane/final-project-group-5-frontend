import type { WalletType } from '@/types/finance';

export interface DefaultWalletTemplate {
  name: string;
  type: WalletType;
  isDefault: boolean;
  sortOrder: number;
}

export const DEFAULT_WALLET: DefaultWalletTemplate = {
  name: 'General',
  type: 'general',
  isDefault: true,
  sortOrder: 1,
};

export const WALLET_TYPE_LABELS: Record<WalletType, string> = {
  general: 'General',
  bank: 'Bank',
  ewallet: 'E-wallet',
  cash: 'Cash',
};

export const WALLET_TYPE_ICONS: Record<WalletType, string> = {
  general: 'wallet-outline',
  bank: 'business-outline',
  ewallet: 'phone-portrait-outline',
  cash: 'cash-outline',
};
