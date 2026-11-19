import { NativeModules, Platform } from 'react-native';

const { LockScreen } = NativeModules;

export interface LockScreenServiceBridge {
  startLockScreenService: () => Promise<boolean>;
  stopLockScreenService: () => Promise<boolean>;
  isLockScreenEnabled: () => Promise<boolean>;
  isKeyguardLocked: () => Promise<boolean>;
  dismissKeyguard: () => Promise<boolean>;
  hasOverlayPermission: () => Promise<boolean>;
  requestOverlayPermission: () => Promise<boolean>;
}

export const lockScreenService: LockScreenServiceBridge = {
  startLockScreenService: async () => {
    if (Platform.OS === 'android' && LockScreen && typeof LockScreen.startLockScreenService === 'function') {
      try {
        return await LockScreen.startLockScreenService();
      } catch (e) {
        console.warn('[LockScreen] Failed to start lockscreen service:', e);
        return false;
      }
    }
    return false;
  },

  stopLockScreenService: async () => {
    if (Platform.OS === 'android' && LockScreen && typeof LockScreen.stopLockScreenService === 'function') {
      try {
        return await LockScreen.stopLockScreenService();
      } catch (e) {
        console.warn('[LockScreen] Failed to stop lockscreen service:', e);
        return false;
      }
    }
    return false;
  },

  isLockScreenEnabled: async () => {
    if (Platform.OS === 'android' && LockScreen && typeof LockScreen.isLockScreenEnabled === 'function') {
      try {
        return await LockScreen.isLockScreenEnabled();
      } catch (e) {
        return true;
      }
    }
    return false;
  },

  isKeyguardLocked: async () => {
    if (Platform.OS === 'android' && LockScreen && typeof LockScreen.isKeyguardLocked === 'function') {
      try {
        return await LockScreen.isKeyguardLocked();
      } catch (e) {
        return false;
      }
    }
    return false;
  },

  dismissKeyguard: async () => {
    if (Platform.OS === 'android' && LockScreen && typeof LockScreen.dismissKeyguard === 'function') {
      try {
        return await LockScreen.dismissKeyguard();
      } catch (e) {
        console.warn('[LockScreen] Failed to dismiss keyguard:', e);
        return false;
      }
    }
    return false;
  },

  hasOverlayPermission: async () => {
    if (Platform.OS === 'android' && LockScreen && typeof LockScreen.hasOverlayPermission === 'function') {
      try {
        return await LockScreen.hasOverlayPermission();
      } catch (e) {
        return true;
      }
    }
    return true;
  },

  requestOverlayPermission: async () => {
    if (Platform.OS === 'android' && LockScreen && typeof LockScreen.requestOverlayPermission === 'function') {
      try {
        return await LockScreen.requestOverlayPermission();
      } catch (e) {
        console.warn('[LockScreen] Failed to request overlay permission:', e);
        return false;
      }
    }
    return false;
  },
};
