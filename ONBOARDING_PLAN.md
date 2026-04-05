# Budgy Onboarding & Auth Flow — Implementation Plan

## Context

The Budgy frontend is a React Native/Expo app with zero auth screens implemented. The backend has Supabase JWT validation and a `POST /profile/complete-onboarding` endpoint already working. The goal is to build the full user journey: splash → login/signup → onboarding (new users only) → home. Routing decisions are driven by the `onboarding_done` boolean in the user's profile.

---

## Target File Structure

```
final-project-group-5-frontend/
├── app/
│   ├── _layout.tsx                  ← MODIFY: AuthProvider + route guard
│   ├── index.tsx                    ← MODIFY: empty redirect shim
│   ├── (auth)/
│   │   ├── _layout.tsx              ← NEW: Stack, no header, fade animation
│   │   ├── login.tsx                ← NEW
│   │   └── signup.tsx               ← NEW
│   ├── (onboarding)/
│   │   ├── _layout.tsx              ← NEW: Stack, gestureEnabled: false
│   │   ├── step-1-currency.tsx      ← NEW
│   │   └── step-2-balance.tsx       ← NEW (contains complete-onboarding call)
│   └── (app)/
│       ├── _layout.tsx              ← NEW: placeholder tabs layout
│       └── home.tsx                 ← NEW: welcome + sign out placeholder
├── lib/
│   └── supabase.ts                  ← NEW: Supabase client with AsyncStorage
├── context/
│   └── AuthContext.tsx              ← NEW: session, profile, auth methods
├── hooks/
│   └── useOnboardingStore.ts        ← NEW: module-level store for onboarding step data
├── components/
│   ├── SplashScreenView.tsx         ← NEW: in-app animated splash (shown while loading)
│   └── ui/
│       ├── Button.tsx               ← NEW
│       └── Input.tsx                ← NEW
└── constants/
    └── currencies.ts                ← NEW: ~30 common currencies
```

---

## Step 1: Dependencies & Config

**Install (run from `final-project-group-5-frontend/`):**
```bash
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage expo-auth-session expo-crypto
npm install react-native-url-polyfill
```

**`app.json`**: Change `scheme` to `"budgy"` — required for OAuth deep links to return to the app.

**`.env.local`** (create):
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_BASE_URL=http://<lan-ip>:3000
```
Use LAN IP (not localhost) for physical device testing.

---

## Step 2: Supabase Client (`lib/supabase.ts`)

```typescript
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,   // MUST be false in React Native
    },
  }
);
```

---

## Step 3: AuthContext (`context/AuthContext.tsx`)

**State**: `session`, `user`, `profile`, `loading`

**Methods**:
- `signInWithEmail(email, password)` → `supabase.auth.signInWithPassword()`
- `signUpWithEmail(email, password, fullName)` → `supabase.auth.signUp({ options: { data: { full_name: fullName } } })` so the DB trigger captures the name
- `signInWithGoogle()` → `expo-web-browser` + `supabase.auth.signInWithOAuth({ provider: 'google', options: { skipBrowserRedirect: true } })`
- `signOut()` → `supabase.auth.signOut()`
- `refreshProfile()` → re-fetches from backend and updates profile state

**Profile fetch** (called on every `SIGNED_IN` / `TOKEN_REFRESHED` auth event):
```typescript
const fetchProfile = async (accessToken: string) => {
  const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/profile`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.json();  // Profile shape includes onboarding_done
};
```

**Session listener**: `supabase.auth.onAuthStateChange` in a `useEffect`. On `SIGNED_IN`/`TOKEN_REFRESHED`, fetch profile and set state. On `SIGNED_OUT`, clear all state.

---

## Step 4: Root `_layout.tsx` (Route Guard)

**Critical**: `import 'react-native-url-polyfill/auto'` must be the FIRST line, before all other imports.

**Pattern**: Outer component wraps `<AuthProvider>`, inner component `RootLayoutNav` consumes auth state and has the guard logic. This is required because `useRouter`/`useSegments` must be called inside a child of the Expo Router context, while `AuthProvider` is a sibling.

```typescript
function RootLayoutNav() {
  const { session, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';
    const inApp = segments[0] === '(app)';

    if (!session) {
      if (!inAuth) router.replace('/(auth)/login');
    } else if (profile) {
      if (!profile.onboarding_done && !inOnboarding) {
        router.replace('/(onboarding)/step-1-currency');
      } else if (profile.onboarding_done && !inApp) {
        router.replace('/(app)/home');
      }
    }
    // If session exists but profile is still null, wait for next render
  }, [session, profile, loading]);

  if (loading) return <SplashScreenView />;

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
```

---

## Step 5: Splash Screen (`components/SplashScreenView.tsx`)

Shown while `loading === true` (auth state resolving). Uses `react-native-reanimated` `FadeIn` (already installed):

- Full-screen dark background (`#111410`)
- Centered lime circle with "B" monogram
- "budgy" wordmark in `text-budgy-lime`
- Tagline: "smart money, simple life" in `text-secondary`
- Fade-in animation on mount

Also update `app.json` native splash: `backgroundColor: "#1A1E14"` with app icon.

```typescript
import Animated, { FadeIn } from 'react-native-reanimated';
import { View, Text } from 'react-native';

export function SplashScreenView() {
  return (
    <View className="flex-1 items-center justify-center bg-dark">
      <Animated.View entering={FadeIn.duration(600)} className="items-center">
        <View className="w-24 h-24 rounded-full bg-budgy-lime items-center justify-center">
          <Text className="text-4xl font-bold text-dark">B</Text>
        </View>
        <Text className="text-budgy-lime text-3xl font-bold text-center mt-4">budgy</Text>
        <Text className="text-secondary text-sm text-center mt-2">smart money, simple life</Text>
      </Animated.View>
    </View>
  );
}
```

---

## Step 6: Auth Screens

### Login (`app/(auth)/login.tsx`)
- Fields: Email, Password (with show/hide toggle)
- Primary button: "Log In" (`bg-budgy-lime`, `text-dark`)
- Google button: outlined, Google icon via `@expo/vector-icons`
- Link: "Don't have an account? Sign up" → `router.push('/(auth)/signup')`
- Inline field errors + top-level API error card (red-tinted: `bg-budgy-red/10 border border-budgy-red`)
- Loading state: disable buttons, show `ActivityIndicator` inside primary button

### Signup (`app/(auth)/signup.tsx`)
- Fields: Full Name, Email, Password, Confirm Password
- Client-side: passwords must match before submitting
- Same button/SSO pattern as login
- Link: "Already have an account? Log in"
- **Note**: Disable email confirmation in Supabase dashboard (Auth → Providers → Email) for dev; otherwise `signUp` returns `session: null` and you need a "check your email" state

---

## Step 7: Onboarding Screens

### Shared store (`hooks/useOnboardingStore.ts`)
Module-level object to share data between the two steps:
```typescript
const store = { fullName: '', currency: 'PHP', balance: 0 };
export const useOnboardingStore = () => ({
  get: () => ({ ...store }),
  set: (patch: Partial<typeof store>) => Object.assign(store, patch),
});
```
Populate `fullName` from `profile.full_name` on step 1 mount.

### Step 1 — Currency (`app/(onboarding)/step-1-currency.tsx`)
- Progress dots (1/2 active)
- Search input filters `CURRENCIES` list from `constants/currencies.ts`
- `FlatList` of currencies: code (bold), name (secondary), checkmark on selected
- Default selection: `'PHP'`
- "Continue" → saves to store → `router.push('/(onboarding)/step-2-balance')`

**`constants/currencies.ts`**: Array of `{ code, name, symbol }` for ~30 common currencies:
PHP, USD, EUR, GBP, JPY, SGD, AUD, CAD, CNY, KRW, HKD, CHF, INR, MXN, BRL, THB, IDR, MYR, VND, AED, etc.

### Step 2 — Balance (`app/(onboarding)/step-2-balance.tsx`)
- Progress dots (2/2 active)
- Large centered numeric input (`keyboardType="decimal-pad"`)
- Currency symbol shown as prefix
- "Complete Setup" button triggers onboarding completion

**Complete onboarding call**:
```typescript
const { full_name, currency, balance } = useOnboardingStore().get();
const res = await fetch(`${API_BASE_URL}/api/profile/complete-onboarding`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session!.access_token}`,
  },
  body: JSON.stringify({ full_name, currency, balance: Number(balance) }),
});
if (res.ok) {
  await refreshProfile();  // Updates profile state → route guard fires → navigates to home
}
```

---

## Step 8: UI Components

### `components/ui/Button.tsx`
Props: `title`, `onPress`, `variant` (`primary | outline | google`), `loading`, `disabled`

Use static class lookup maps — never template literals (NativeWind can't analyze dynamic classes):
```typescript
const bg = {
  primary: 'bg-budgy-lime active:bg-budgy-lime-dark',
  outline: 'bg-transparent border border-secondary',
  google: 'bg-card border border-card-deep',
};
const fg = {
  primary: 'text-dark font-semibold',
  outline: 'text-text font-medium',
  google: 'text-text font-medium',
};
```

### `components/ui/Input.tsx`
Props: `label`, `error`, `leftIcon`, `rightIcon`, `...TextInputProps`

Use `placeholderTextColor="#9DA28F"` as a direct prop (not className) — NativeWind v4 does not reliably style placeholder color via className on `TextInput`.

---

## Step 9: Home Placeholder (`app/(app)/home.tsx`)

Display `profile.full_name` and a sign-out button to confirm the entire flow works end-to-end.

---

## Google SSO Notes

The `signInWithGoogle` implementation:
```typescript
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();  // Must be at module level

const signInWithGoogle = async () => {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'budgy', path: 'google-auth' });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: redirectUri, skipBrowserRedirect: true },
  });

  if (error || !data.url) return { error: error?.message ?? 'OAuth failed' };

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

  if (result.type === 'success' && result.url) {
    // Supabase returns tokens in the URL fragment (#access_token=...)
    const params = new URLSearchParams(result.url.split('#')[1]);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    if (accessToken && refreshToken) {
      await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    }
  }
  return { error: null };
};
```

**Google SSO does NOT work in Expo Go** — requires a development build (`expo run:android` / `expo run:ios`). Use email/password for Expo Go testing.

---

## Implementation Order

1. Change `scheme` in `app.json` → `"budgy"`
2. Install all dependencies
3. Create `.env.local`
4. `lib/supabase.ts`
5. `context/AuthContext.tsx` (email auth only; Google SSO last)
6. Rewrite `app/_layout.tsx` with provider + route guard
7. Group `_layout.tsx` files for `(auth)`, `(onboarding)`, `(app)`
8. `components/ui/Button.tsx` + `components/ui/Input.tsx`
9. `components/SplashScreenView.tsx`
10. `app/(auth)/login.tsx` → verify login → home flow
11. `app/(auth)/signup.tsx` → verify signup → onboarding routing
12. `constants/currencies.ts`
13. `app/(onboarding)/step-1-currency.tsx`
14. `app/(onboarding)/step-2-balance.tsx` → verify complete-onboarding API call
15. `app/(app)/home.tsx`
16. Implement Google SSO last (requires dev build)

---

## Verification Checklist

- [ ] Email login: existing account → lands on Home
- [ ] Email signup: new account → step-1-currency → step-2-balance → Home
- [ ] Session persistence: close/reopen app → goes straight to Home (not login)
- [ ] Logout + re-login: sign out → back to Login
- [ ] Route guard: navigate to `/(app)/home` while signed out → redirected to login
- [ ] Incomplete onboarding: user with `onboarding_done: false` → redirected to step 1
- [ ] Google SSO (dev build only): same routing logic applies after auth

---

## Key Gotchas

| Area | Gotcha |
|---|---|
| URL Polyfill | `import 'react-native-url-polyfill/auto'` must be the FIRST import in `_layout.tsx` |
| Supabase client | `detectSessionInUrl: false` is required in React Native |
| NativeWind classes | Never use template literals for class names; use static lookup maps |
| NativeWind `TextInput` | Use `placeholderTextColor` prop directly, not via className |
| Route guard pattern | Guard must be in a child component of `<AuthProvider>`, not the same component |
| Google OAuth | Does not work in Expo Go; requires a development build |
| OAuth redirect | `WebBrowser.maybeCompleteAuthSession()` must be called at module level |
| Token parsing | Supabase returns tokens in URL fragment (`#`), not query string |
| API base URL | Use LAN IP for physical device testing, not `localhost` |
| Email confirmation | Disable in Supabase dashboard for development |
| `app.json` scheme | Must be `"budgy"` for OAuth deep links to work |
| Onboarding gesture | Set `gestureEnabled: false` on onboarding layout so users can't swipe back to auth |
| `refreshProfile` | Must update `profile` state in AuthContext so the route guard re-evaluates |
