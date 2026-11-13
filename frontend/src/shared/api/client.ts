import axios from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://narayan-agent.onrender.com/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
