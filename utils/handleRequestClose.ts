import { Alert } from 'react-native';

/**
 * Shows a discard changes alert if the form is dirty, otherwise calls onClose directly.
 * @param params.mode - The current mode (e.g., 'create', 'edit', etc.)
 * @param params.formik - The formik instance (must have .dirty property)
 * @param params.onClose - The function to call to close the modal
 */
export function handleRequestClose({ mode, formik, onClose }: {
  mode: string;
  formik: { dirty: boolean };
  onClose: () => void;
}) {
  if (mode === 'create' && formik.dirty) {
    Alert.alert(
      'Discard changes?',
      'You have unsaved changes. If you leave now, your progress will be lost.',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: onClose },
      ],
    );
  } else {
    onClose();
  }
}
