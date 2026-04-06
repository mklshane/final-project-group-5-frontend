import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

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
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={[s.overlay, { backgroundColor: theme.overlayModal }]}>
        <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[s.title, { color: theme.text }]}>{title}</Text>
          <Text style={[s.message, { color: theme.secondary }]}>{message}</Text>

          <View style={s.actions}>
            <Pressable style={[s.button, { backgroundColor: theme.surfaceDeep }]} onPress={onCancel}>
              <Text style={[s.buttonLabel, { color: theme.text }]}>{cancelLabel}</Text>
            </Pressable>
            <Pressable style={[s.button, { backgroundColor: theme.red }]} onPress={onConfirm}>
              <Text style={[s.buttonLabel, { color: '#FFFFFF' }]}>{confirmLabel}</Text>
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
