import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import { DOCK_SPACES, SpaceId } from './navigation.types';
import { useNavigationStore } from './navigation.store';
import { colors, radii, spacing, typography } from '../../shared/theme/tokens';

export const Dock: React.FC = () => {
  const { isDockOpen, closeDock, currentSpace, navigate } = useNavigationStore();

  if (!isDockOpen) return null;

  return (
    <Modal
      visible={isDockOpen}
      transparent
      animationType="fade"
      onRequestClose={closeDock}
    >
      <Pressable style={styles.backdrop} onPress={closeDock}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>NRYN SPACES</Text>
            <TouchableOpacity onPress={closeDock} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {DOCK_SPACES.map((space) => {
              const isActive = currentSpace === space.id;
              return (
                <TouchableOpacity
                  key={space.id}
                  style={[
                    styles.spaceCard,
                    { borderColor: isActive ? colors.ink : 'transparent' },
                  ]}
                  onPress={() => {
                    navigate(space.id);
                  }}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.glyphShape,
                      { backgroundColor: space.color },
                    ]}
                  >
                    <Text style={styles.glyphEmoji}>
                      {getSpaceEmoji(space.id)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.spaceLabel,
                      isActive && styles.activeSpaceLabel,
                    ]}
                    numberOfLines={1}
                  >
                    {space.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

function getSpaceEmoji(id: SpaceId): string {
  switch (id) {
    case 'today':
      return '⏱';
    case 'kickstart':
      return '☀️';
    case 'health':
      return '🏃';
    case 'inbox':
      return '👥';
    case 'email':
      return '✉️';
    case 'finance':
      return '💰';
    case 'work':
      return '💼';
    case 'prayan':
      return '🧩';
    case 'travel':
      return '✈️';
    case 'spirit':
      return '🧘';
    case 'growth':
      return '🌱';
    case 'notes':
      return '📝';
    case 'settings':
      return '⚙️';
    default:
      return '•';
  }
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    maxHeight: 220,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderDark,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  title: {
    fontSize: typography.bodySm.fontSize,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.muted,
    letterSpacing: 1.5,
  },
  closeBtn: {
    fontSize: 16,
    color: colors.ink,
    padding: 4,
  },
  scrollContent: {
    paddingVertical: spacing.xs,
    gap: spacing.md,
  },
  spaceCard: {
    alignItems: 'center',
    width: 68,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    borderWidth: 1.5,
  },
  glyphShape: {
    width: 46,
    height: 46,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  glyphEmoji: {
    fontSize: 22,
  },
  spaceLabel: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.inkSecondary,
    textAlign: 'center',
  },
  activeSpaceLabel: {
    color: colors.ink,
    fontWeight: '700',
  },
});
