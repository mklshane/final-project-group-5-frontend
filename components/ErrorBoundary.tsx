import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={s.container}>
        <Text style={s.title}>Something went wrong</Text>
        <Text style={s.message}>
          {this.state.error?.message ?? 'An unexpected error occurred.'}
        </Text>
        <Pressable style={s.button} onPress={this.reset}>
          <Text style={s.buttonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}

const s = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 8, color: '#111' },
  message: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24 },
  button: { backgroundColor: '#007AFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
