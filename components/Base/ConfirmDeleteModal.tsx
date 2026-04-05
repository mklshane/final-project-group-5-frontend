import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useColorScheme } from 'nativewind';

interface ConfirmDeleteModalProps {
  visible: boolean;
  title?: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function ConfirmDeleteModal({
  visible,
  title = 'Delete transaction?',
  message,
  onCancel,
  onConfirm,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
}: ConfirmDeleteModalProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const palette = {
    overlay: isDark ? 'rgba(0,0,0,0.64)' : 'rgba(26,30,20,0.45)',
    card: isDark ? '#1A1E14' : '#FFFFFF',
    border: isDark ? '#2C3122' : '#E4E6D6',
    title: isDark ? '#EDF0E4' : '#1A1E14',
    text: isDark ? '#8A8F7C' : '#6B7060',
    cancelBg: isDark ? '#222618' : '#EEF0E2',
    cancelText: isDark ? '#EDF0E4' : '#1A1E14',
    confirmBg: '#FF6B6B',
    confirmText: '#FFFFFF',
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={[s.overlay, { backgroundColor: palette.overlay }]}>
        <View style={[s.card, { backgroundColor: palette.card, borderColor: palette.border }]}> 
          <Text style={[s.title, { color: palette.title }]}>{title}</Text>
          <Text style={[s.message, { color: palette.text }]}>{message}</Text>

          <View style={s.actions}>
            <Pressable style={[s.button, { backgroundColor: palette.cancelBg }]} onPress={onCancel}>
              <Text style={[s.buttonLabel, { color: palette.cancelText }]}>{cancelLabel}</Text>
            </Pressable>
            <Pressable style={[s.button, { backgroundColor: palette.confirmBg }]} onPress={onConfirm}>
              <Text style={[s.buttonLabel, { color: palette.confirmText }]}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
});
