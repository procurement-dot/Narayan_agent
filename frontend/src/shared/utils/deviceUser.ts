import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

const DEVICE_USER_ID_KEY = 'nryn_device_user_id';
const FILE_PATH =
  (FileSystem as any)?.documentDirectory
    ? `${(FileSystem as any).documentDirectory}nryn_device_user_id.txt`
    : null;

let cachedUserId: string | null = null;

export function isValidUUID(str: string | null | undefined): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {}
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Persist device ID to storage based on platform
 */
export async function persistDeviceUserId(id: string): Promise<void> {
  cachedUserId = id;

  const isWeb = (Platform.OS as string) === 'web';

  if (isWeb) {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(DEVICE_USER_ID_KEY, id);
      } catch (e) {
        console.warn('[DeviceUser] Could not persist to localStorage:', e);
      }
    }
    return;
  }

  if (!isWeb && FILE_PATH) {
    try {
      await FileSystem.writeAsStringAsync(FILE_PATH, id);
    } catch (e) {
      console.warn('[DeviceUser] Could not persist to file system:', e);
    }
  }
}

/**
 * Synchronous getter: returns in-memory cached user ID or web localStorage value.
 * If not yet initialized, returns a freshly generated UUID and persists it in the background.
 */
export function getDeviceUserIdSync(): string {
  if (cachedUserId && isValidUUID(cachedUserId)) {
    return cachedUserId;
  }

  const isWeb = (Platform.OS as string) === 'web';
  if (isWeb && typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = window.localStorage.getItem(DEVICE_USER_ID_KEY);
      if (stored && isValidUUID(stored)) {
        cachedUserId = stored.trim();
        return cachedUserId;
      }
    } catch {}
  }

  const newId = generateUUID();
  cachedUserId = newId;
  persistDeviceUserId(newId).catch(() => {});
  return newId;
}

/**
 * Asynchronous getter: guarantees a persistent device user ID across app launches.
 */
export async function getDeviceUserId(): Promise<string> {
  if (cachedUserId && isValidUUID(cachedUserId)) {
    return cachedUserId;
  }

  const isWeb = (Platform.OS as string) === 'web';

  // 1. Web LocalStorage
  if (isWeb) {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem(DEVICE_USER_ID_KEY);
        if (stored && isValidUUID(stored)) {
          cachedUserId = stored.trim();
          return cachedUserId;
        }
      } catch (e) {
        console.warn('[DeviceUser] Error reading localStorage:', e);
      }
    }
  }

  // 2. Native FileSystem (Android / iOS)
  if (!isWeb && FILE_PATH) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(FILE_PATH);
      if (fileInfo.exists) {
        const stored = await FileSystem.readAsStringAsync(FILE_PATH);
        if (stored && isValidUUID(stored.trim())) {
          cachedUserId = stored.trim();
          return cachedUserId;
        }
      }
    } catch (e) {
      console.warn('[DeviceUser] Error reading device ID file:', e);
    }
  }

  // 3. Generate new unique ID for this device
  const newId = generateUUID();
  cachedUserId = newId;
  await persistDeviceUserId(newId);
  return newId;
}
