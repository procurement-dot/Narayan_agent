import { Platform } from 'react-native';

export const FONTS = {
  regular: Platform.select({
    ios: 'Inter',
    android: 'Inter',
    default: 'Inter, system-ui, sans-serif',
  }),
  serif: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'Georgia, serif',
  }),
};
