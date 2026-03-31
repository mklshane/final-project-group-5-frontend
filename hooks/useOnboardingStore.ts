const store = { currency: 'PHP', balance: 0 };

export const useOnboardingStore = () => ({
  get: () => ({ ...store }),
  set: (patch: Partial<typeof store>) => Object.assign(store, patch),
  reset: () => {
    store.currency = 'PHP';
    store.balance = 0;
  },
});
