import { StyleSheet } from 'react-native';
import { TOKENS } from '../../../shared/theme/tokens';
import { FONTS } from '../../../shared/theme/fonts';

export const emailStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TOKENS.colors.bg,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 12,
  },
  backChevron: {
    fontSize: 28,
    color: '#82968a',
    fontFamily: FONTS.serif,
    lineHeight: 28,
  },
  headerTitle: {
    fontFamily: FONTS.serif,
    fontSize: 28,
    color: TOKENS.colors.ink,
    letterSpacing: -0.5,
  },

  // Summary Card
  summaryKicker: {
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    fontWeight: '700',
    color: '#9aa49a',
  },
  summaryText: {
    fontSize: 12,
    color: '#778177',
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 10,
    fontFamily: FONTS.regular,
  },
  reviewBtn: {
    alignSelf: 'flex-start',
    backgroundColor: TOKENS.colors.paper,
    borderWidth: 1,
    borderColor: '#e1e7de',
    borderRadius: 13,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  reviewBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#33463a',
    fontFamily: FONTS.regular,
  },

  // Email Rows
  rowItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.colors.line,
    gap: 12,
  },
  rowItemLast: {
    borderBottomWidth: 0,
  },
  iconTile: {
    width: 33,
    height: 33,
    borderRadius: TOKENS.radius.icon,
    backgroundColor: TOKENS.colors.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 16,
    color: TOKENS.colors.ink,
  },
  rowMain: {
    flex: 1,
  },
  rowSubject: {
    fontSize: TOKENS.typography.titleSize,
    fontWeight: '700',
    color: TOKENS.colors.rowTitle,
    lineHeight: 17,
    fontFamily: FONTS.regular,
  },
  rowPreview: {
    fontSize: TOKENS.typography.previewSize,
    color: TOKENS.colors.rowPreview,
    marginTop: 3,
    lineHeight: 16,
    fontFamily: FONTS.regular,
  },
  rowStatus: {
    fontSize: TOKENS.typography.statusSize,
    color: TOKENS.colors.statusText,
    marginTop: 5,
    fontFamily: FONTS.regular,
  },
  openBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  openBtnText: {
    fontSize: TOKENS.typography.openSize,
    fontWeight: '700',
    color: TOKENS.colors.openBtn,
    fontFamily: FONTS.regular,
  },

  // Empty state
  emptyContainer: {
    paddingVertical: 36,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: FONTS.serif,
    fontSize: 16,
    color: '#839084',
  },

  // Explainer / Source Card
  explainerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TOKENS.colors.ink,
    marginBottom: 10,
    fontFamily: FONTS.regular,
  },
  explainerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0eb',
  },
  explainerRowLast: {
    borderBottomWidth: 0,
  },
  explainerRowTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: TOKENS.colors.ink,
    fontFamily: FONTS.regular,
  },
  explainerRowDesc: {
    fontSize: 11,
    color: TOKENS.colors.inkMuted,
    lineHeight: 16,
    marginTop: 2,
    fontFamily: FONTS.regular,
  },

  // Trust Footer
  trustText: {
    fontSize: 10,
    lineHeight: 16,
    color: '#9da69d',
    textAlign: 'center',
    marginVertical: 18,
    fontFamily: FONTS.regular,
  },
});
