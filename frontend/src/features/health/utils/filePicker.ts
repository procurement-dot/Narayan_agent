import { Platform, NativeModules } from 'react-native';

export interface PickedFile {
  name: string;
  size: number;
  mimeType: string;
  base64: string;
}

export async function pickFileOrPhoto(accept = 'image/*,application/pdf'): Promise<PickedFile | null> {
  const isWeb = Platform.OS === 'web';

  // 1. Web / React Native Web environment
  if (isWeb && typeof document !== 'undefined') {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept;
      input.style.display = 'none';

      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64Content = result.includes('base64,') ? result.split('base64,')[1] : result;
          resolve({
            name: file.name,
            size: file.size,
            mimeType: file.type || 'image/jpeg',
            base64: base64Content,
          });
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      };

      input.oncancel = () => resolve(null);
      document.body.appendChild(input);
      input.click();
      setTimeout(() => {
        document.body.removeChild(input);
      }, 500);
    });
  }

  // 2. Mobile Native Android / iOS environment
  if (NativeModules.OAuthServer && typeof NativeModules.OAuthServer.pickDocument === 'function') {
    try {
      const res = await NativeModules.OAuthServer.pickDocument(accept);
      if (res && res.base64) {
        return res as PickedFile;
      }
    } catch (e) {
      console.warn('[FilePicker] native pickDocument error:', e);
    }
  }

  return null;
}
