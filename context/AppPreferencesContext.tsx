import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

type ThemeMode = 'system' | 'light' | 'dark';

interface NotificationPreferences {
  budgetAlerts: boolean;
  largeExpenseWarnings: boolean;
  dailySummary: boolean;
  weeklyReport: boolean;
  goalMilestones: boolean;
}

interface AppPreferencesState {
  themeMode: ThemeMode;
  currencyCode: string;
  notifications: NotificationPreferences;
}

interface AppPreferencesContextValue extends AppPreferencesState {
  hydrated: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setCurrencyCode: (code: string) => void;
  setNotificationPreference: (key: keyof NotificationPreferences, value: boolean) => void;
}

const STORAGE_KEY = 'budgy_app_preferences_v1';

const defaultState: AppPreferencesState = {
  themeMode: 'system',
  currencyCode: 'PHP',
  notifications: {
    budgetAlerts: true,
    largeExpenseWarnings: true,
    dailySummary: false,
    weeklyReport: true,
    goalMilestones: true,
  },
};

const AppPreferencesContext = createContext<AppPreferencesContextValue | null>(null);

export function AppPreferencesProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const [state, setState] = useState<AppPreferencesState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const hydrate = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) {
          setHydrated(true);
          return;
        }

        const parsed = JSON.parse(raw) as Partial<AppPreferencesState>;
        setState((prev) => ({
          ...prev,
          ...parsed,
          notifications: {
            ...prev.notifications,
            ...(parsed.notifications ?? {}),
          },
        }));
      } catch {
        // Ignore persisted preference parse errors and keep defaults.
      } finally {
        setHydrated(true);
      }
    };

    hydrate();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined);
  }, [state, hydrated]);

  useEffect(() => {
    const nextCurrencyCode = profile?.currency;
    if (!nextCurrencyCode) return;

    setState((prev) => {
      if (prev.currencyCode === nextCurrencyCode) return prev;
      return { ...prev, currencyCode: nextCurrencyCode };
    });
  }, [profile?.currency]);

  const value = useMemo<AppPreferencesContextValue>(
    () => ({
      ...state,
      hydrated,
      setThemeMode: (mode) => setState((prev) => ({ ...prev, themeMode: mode })),
      setCurrencyCode: (code) => setState((prev) => ({ ...prev, currencyCode: code })),
      setNotificationPreference: (key, value) =>
        setState((prev) => ({
          ...prev,
          notifications: {
            ...prev.notifications,
            [key]: value,
          },
        })),
    }),
    [state, hydrated]
  );

  return <AppPreferencesContext.Provider value={value}>{children}</AppPreferencesContext.Provider>;
}

export function useAppPreferences() {
  const context = useContext(AppPreferencesContext);
  if (!context) throw new Error('useAppPreferences must be used within AppPreferencesProvider');
  return context;
}
