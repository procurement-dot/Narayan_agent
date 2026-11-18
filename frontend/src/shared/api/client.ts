import axios from 'axios';
import { Platform } from 'react-native';
import { getDeviceUserId } from '../utils/deviceUser';

const isWeb = Platform.OS === 'web';

const isLocalhostWeb =
  isWeb &&
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.startsWith('10.'));

const defaultWebUrl = isLocalhostWeb && typeof window !== 'undefined'
  ? `http://${window.location.hostname}:4000/api`
  : 'https://narayan-agent.onrender.com/api';

const envUrl = process.env.EXPO_PUBLIC_API_URL;

// On mobile native (APK), 'localhost' points to the phone itself, so fallback to cloud backend
const API_BASE_URL = !isWeb && (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))
  ? 'https://narayan-agent.onrender.com/api'
  : (envUrl || defaultWebUrl);

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach persistent device user ID to every request for tenant/device isolation
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const userId = await getDeviceUserId();
      if (userId) {
        config.headers = config.headers || {};
        config.headers['x-user-id'] = userId;
      }
    } catch (err) {
      console.warn('[API Client] Failed to attach x-user-id header:', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Automatic retry for Render cold starts (502 / 503 / 504 / network timeout)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (!config || config.__isRetry) {
      return Promise.reject(error);
    }

    const isTimeout = error.code === 'ECONNABORTED';
    const isColdStart = error.response && [502, 503, 504].includes(error.response.status);
    const isNetworkError = !error.response && Boolean(error.request);

    if (isTimeout || isColdStart || isNetworkError) {
      config.__isRetry = true;
      console.warn('[API Client] Server waking up or network retry in progress...', config.url);
      await new Promise((resolve) => setTimeout(resolve, 2500));
      return apiClient(config);
    }

    return Promise.reject(error);
  }
);
