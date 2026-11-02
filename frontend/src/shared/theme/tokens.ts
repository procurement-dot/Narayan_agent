import { FONTS } from './fonts';

export const colors = {
  bg: '#fdfcf9',
  paper: '#ffffff',
  surface: '#ffffff',
  surfaceWarm: '#f7eee8',
  ink: '#292e29',
  inkSecondary: '#525a52',
  inkMuted: '#8b928b',
  muted: '#8b928b',
  accent: '#cd8167',
  accentDark: '#ae613f',
  accentWash: '#f7eee8',
  sage: '#769082',
  sageWash: '#edf4ef',
  line: '#eceae4',
  borderLight: '#eceae4',
  borderDark: '#dce2d9',
  rowTitle: '#354238',
  rowPreview: '#6b7269',
  statusText: '#b18068',
  openBtn: '#a56b50',
  iconBg: '#eef2ec',
  tabBorder: '#dce2d9',
  tabSelectedBg: '#526b5d',
  inputBorder: '#e4e6df',
  noticeBg: '#f3f4ef',
  noticeBorder: '#e8ebe6',
  overlayBg: 'rgba(26, 35, 28, 0.36)',
  toastBg: '#27372b',
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 9999,
  card: 22,
  sheet: 25,
  icon: 13,
  input: 12,
  toast: 14,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  fontFamily: {
    uiRegular: FONTS.regular,
    uiMedium: FONTS.regular,
    serifRegular: FONTS.serif,
  },
  kicker: {
    fontSize: 10,
    letterSpacing: 1.2,
  },
  headline: {
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  bodySm: {
    fontSize: 13,
    lineHeight: 18,
  },
  titleSize: 12,
  previewSize: 11,
  statusSize: 10,
  openSize: 11,
  headerTitleSize: 22,
  kickerSize: 10,
  bodySize: 13,
};

export const TOKENS = {
  colors,
  radius: radii,
  typography,
} as const;
