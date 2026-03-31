import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { devStore } from '@/lib/devStore';

interface NavItem {
  label: string;
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Auth',
    items: [
      { label: 'Login', route: '/(auth)/login', icon: 'log-in-outline' },
      { label: 'Sign Up', route: '/(auth)/signup', icon: 'person-add-outline' },
    ],
  },
  {
    title: 'Onboarding',
    items: [
      { label: 'Step 1 · Currency', route: '/(onboarding)/step-1-currency', icon: 'cash-outline' },
      { label: 'Step 2 · Balance', route: '/(onboarding)/step-2-balance', icon: 'wallet-outline' },
    ],
  },
  {
    title: 'App',
    items: [
      { label: 'Home', route: '/(app)/home', icon: 'home-outline' },
    ],
  },
];

export function DevPanel() {
  const [open, setOpen] = useState(false);
  const [bypass, setBypass] = useState(devStore.isBypassing());
  const router = useRouter();
  const segments = useSegments();
  const currentRoute = '/' + segments.join('/');

  const toggleBypass = () => {
    const next = !bypass;
    devStore.setBypass(next);
    setBypass(next);
  };

  const navigate = (route: string) => {
    router.push(route as Parameters<typeof router.push>[0]);
  };

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        bottom: 28,
        right: 16,
        alignItems: 'flex-end',
        zIndex: 9999,
      }}
    >
      {open && (
        <View
          style={{
            backgroundColor: '#1A1E14',
            borderRadius: 20,
            borderWidth: 1,
            borderColor: '#2C3122',
            marginBottom: 10,
            width: 230,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.5,
            shadowRadius: 16,
            elevation: 20,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 14,
              paddingTop: 14,
              paddingBottom: 10,
              borderBottomWidth: 1,
              borderBottomColor: '#2C3122',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="terminal-outline" size={14} color="#C8F560" />
              <Text style={{ color: '#C8F560', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 }}>
                DEV PANEL
              </Text>
            </View>
            {/* Guard bypass toggle */}
            <TouchableOpacity
              onPress={toggleBypass}
              activeOpacity={0.8}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: bypass ? '#C8F56020' : '#2C3122',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: bypass ? '#C8F56060' : '#3A4030',
              }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: bypass ? '#C8F560' : '#585D4C',
                }}
              />
              <Text style={{ color: bypass ? '#C8F560' : '#585D4C', fontSize: 10, fontWeight: '600' }}>
                {bypass ? 'bypass on' : 'bypass off'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Screen sections */}
          <ScrollView
            style={{ maxHeight: 320 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 10, gap: 4 }}
          >
            {SECTIONS.map((section) => (
              <View key={section.title} style={{ marginBottom: 6 }}>
                <Text
                  style={{
                    color: '#585D4C',
                    fontSize: 10,
                    fontWeight: '600',
                    letterSpacing: 0.8,
                    textTransform: 'uppercase',
                    marginBottom: 4,
                    marginLeft: 4,
                  }}
                >
                  {section.title}
                </Text>
                {section.items.map((item) => {
                  const isActive = currentRoute.startsWith(item.route.replace(/^\/\(/, '/('));
                  return (
                    <TouchableOpacity
                      key={item.route}
                      onPress={() => navigate(item.route)}
                      activeOpacity={0.75}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderRadius: 12,
                        backgroundColor: isActive ? '#C8F56015' : 'transparent',
                        borderWidth: 1,
                        borderColor: isActive ? '#C8F56040' : 'transparent',
                        marginBottom: 2,
                      }}
                    >
                      <Ionicons
                        name={item.icon}
                        size={15}
                        color={isActive ? '#C8F560' : '#8A8F7C'}
                      />
                      <Text
                        style={{
                          color: isActive ? '#C8F560' : '#C8CCB8',
                          fontSize: 13,
                          fontWeight: isActive ? '600' : '400',
                          flex: 1,
                        }}
                      >
                        {item.label}
                      </Text>
                      {isActive && (
                        <View
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: 2.5,
                            backgroundColor: '#C8F560',
                          }}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </ScrollView>

          {/* Footer hint */}
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: '#2C3122',
              paddingHorizontal: 14,
              paddingVertical: 8,
            }}
          >
            <Text style={{ color: '#585D4C', fontSize: 10, textAlign: 'center' }}>
              {bypass ? 'Route guard disabled — free navigation' : 'Enable bypass to skip auth redirects'}
            </Text>
          </View>
        </View>
      )}

      {/* FAB toggle */}
      <TouchableOpacity
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.85}
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          backgroundColor: open ? '#C8F560' : '#1A1E14',
          borderWidth: 1.5,
          borderColor: open ? '#C8F560' : '#2C3122',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 10,
        }}
      >
        <Ionicons
          name={open ? 'close' : 'terminal-outline'}
          size={20}
          color={open ? '#1A1E14' : '#C8F560'}
        />
      </TouchableOpacity>
    </View>
  );
}
