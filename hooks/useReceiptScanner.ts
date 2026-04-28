import { useCallback, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { ParsedReceipt } from '@/utils/receiptParser';

export type ScanStatus = 'idle' | 'capturing' | 'processing' | 'done' | 'error';

interface UseReceiptScannerReturn {
  status: ScanStatus;
  result: ParsedReceipt | null;
  error: string | null;
  imageUri: string | null;
  scanFromCamera: () => Promise<void>;
  scanFromGallery: () => Promise<void>;
  reset: () => void;
}

export function useReceiptScanner(): UseReceiptScannerReturn {
  const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [result, setResult] = useState<ParsedReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);

  const toBase64 = useCallback(async (uri: string): Promise<{ imageBase64: string; mimeType: string }> => {
    const response = await fetch(uri);
    const blob = await response.blob();

    const mimeType = blob.type || 'image/jpeg';
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(new Error('Failed to read image data.'));
      reader.readAsDataURL(blob);
    });

    const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : '';
    if (!base64) {
      throw new Error('Image conversion failed. Please try another photo.');
    }

    return {
      imageBase64: base64,
      mimeType,
    };
  }, []);

  const processImage = useCallback(async (uri: string) => {
    try {
      setStatus('processing');
      setImageUri(uri);

      if (!API_BASE_URL) {
        throw new Error('Missing EXPO_PUBLIC_API_BASE_URL.');
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Please sign in again before scanning receipts.');
      }

      const payload = await toBase64(uri);
      const response = await fetch(`${API_BASE_URL}/api/receipts/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        if (response.status === 401) {
          throw new Error('Your session expired. Please sign in again, then retry scanning.');
        }
        if (response.status === 403) {
          throw new Error('You do not have permission to scan receipts with this account.');
        }
        if (response.status === 404) {
          throw new Error('Receipt parser endpoint is not available on your backend yet. Deploy the latest backend changes, then try again.');
        }
        if (response.status === 503) {
          throw new Error('Receipt parser is not configured on backend. Set GEMINI_API_KEY and redeploy the server.');
        }
        if (response.status === 429) {
          throw new Error(body?.error ?? 'Receipt parser is rate-limited right now. Please wait about a minute and try again.');
        }
        throw new Error(body?.error ?? `Receipt parsing failed (${response.status}).`);
      }

      const parsed = (await response.json()) as ParsedReceipt;

      setResult(parsed);
      setStatus('done');
    } catch (err) {
      console.error('Receipt scan failed:', err);
      const message = err instanceof Error ? err.message : String(err);
      setError(message || 'Failed to process the image. Please try again.');
      setStatus('error');
    }
  }, [API_BASE_URL, toBase64]);

  const scanFromCamera = useCallback(async () => {
    try {
      setStatus('capturing');
      setError(null);
      setResult(null);

      const { status: permStatus } = await ImagePicker.requestCameraPermissionsAsync();
      if (permStatus !== 'granted') {
        setError('Camera permission is required to scan receipts.');
        setStatus('error');
        return;
      }

      const pickerResult = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });

      if (pickerResult.canceled) {
        setStatus('idle');
        return;
      }

      const cameraUri = pickerResult.assets[0]?.uri;
      if (!cameraUri) { setStatus('idle'); return; }
      await processImage(cameraUri);
    } catch (err) {
      console.error('Camera launch failed:', err);
      setError('Failed to open camera.');
      setStatus('error');
    }
  }, [processImage]);

  const scanFromGallery = useCallback(async () => {
    try {
      setStatus('capturing');
      setError(null);
      setResult(null);

      const { status: permStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permStatus !== 'granted') {
        setError('Gallery permission is required.');
        setStatus('error');
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });

      if (pickerResult.canceled) {
        setStatus('idle');
        return;
      }

      const galleryUri = pickerResult.assets[0]?.uri;
      if (!galleryUri) { setStatus('idle'); return; }
      await processImage(galleryUri);
    } catch (err) {
      console.error('Gallery launch failed:', err);
      setError('Failed to open gallery.');
      setStatus('error');
    }
  }, [processImage]);

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
    setError(null);
    setImageUri(null);
  }, []);

  return {
    status,
    result,
    error,
    imageUri,
    scanFromCamera,
    scanFromGallery,
    reset,
  };
}
