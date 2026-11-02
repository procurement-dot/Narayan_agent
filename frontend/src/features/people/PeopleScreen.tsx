import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { usePeopleStore } from './people.store';
import { AppHeader } from '../navigation/AppHeader';
import { PillTabs } from '../../shared/components/PillTabs';
import { PeopleTab, Person } from './people.types';
import { colors, radii, spacing, typography } from '../../shared/theme/tokens';
import { useToast } from '../../shared/components/Toast';

const PEOPLE_TABS: { id: PeopleTab; label: string }[] = [
  { id: 'people', label: 'People' },
  { id: 'circles', label: 'Circles' },
  { id: 'groups', label: 'Groups' },
  { id: 'foryou', label: 'For you' },
  { id: 'sync', label: 'Sync' },
];

export const PeopleScreen: React.FC = () => {
  const {
    currentTab,
    setTab,
    people,
    messages,
    selectedPerson,
    selectPerson,
  } = usePeopleStore();
  const { showToast } = useToast();

  return (
    <View style={styles.container}>
      <AppHeader
        kicker="RELATIONSHIPS · SHARED CONTEXT"
        title="People & commitments."
        subtitle="Preserve meaningful preferences, promises and conversations."
      />

      <View style={styles.tabsContainer}>
        <PillTabs
          tabs={PEOPLE_TABS}
          activeTab={currentTab}
          onSelect={(t) => setTab(t as PeopleTab)}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Relationship Memory Card */}
        <View style={styles.introCard}>
          <Text style={styles.introKicker}>RELATIONSHIP MEMORY · WITH CONSENT</Text>
          <Text style={styles.introText}>
            Preserve meaningful preferences, celebrations and promises from your selected
            WhatsApp and email conversations. Personal and work contexts remain strictly separate.
          </Text>
        </View>

        {/* Contacts List */}
        <Text style={styles.sectionTitle}>Key Relationships</Text>
        <View style={styles.list}>
          {people.map((person) => (
            <TouchableOpacity
              key={person.id}
              style={styles.personCard}
              onPress={() => selectPerson(person)}
              activeOpacity={0.7}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{person.initial}</Text>
              </View>

              <View style={styles.personInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.personName}>{person.name}</Text>
                  <View
                    style={[
                      styles.scopeBadge,
                      person.scope === 'work' ? styles.scopeWork : styles.scopePersonal,
                    ]}
                  >
                    <Text style={styles.scopeText}>{person.scope}</Text>
                  </View>
                </View>
                <Text style={styles.personRole}>{person.role}</Text>
                <Text style={styles.personCue}>“{person.note}”</Text>
              </View>
              <Text style={styles.arrowIcon}>↗</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Cross-channel Signals (WhatsApp & Calendar) */}
        <Text style={styles.sectionTitle}>Conversation Intelligence (WhatsApp & Mail)</Text>
        <View style={styles.list}>
          {messages.map((m) => (
            <View key={m.id} style={styles.msgCard}>
              <View style={styles.msgHeader}>
                <Text style={styles.msgSender}>{m.name}</Text>
                <Text style={styles.msgPlatform}>{m.platform}</Text>
              </View>
              <Text style={styles.msgText}>{m.text}</Text>
              <View style={styles.draftBox}>
                <Text style={styles.draftLabel}>AI PROPOSED REPLY</Text>
                <Text style={styles.draftText}>{m.reply}</Text>
              </View>
              <View style={styles.msgActions}>
                <TouchableOpacity
                  style={styles.nudgeBtn}
                  onPress={() => showToast('Reply draft copied to clipboard', 'info')}
                >
                  <Text style={styles.nudgeBtnText}>Copy draft</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.reviewBtn}
                  onPress={() => showToast('Review full conversation context', 'info')}
                >
                  <Text style={styles.reviewBtnText}>Review ↗</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Person Detail Modal */}
      <Modal visible={!!selectedPerson} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={styles.avatarLarge}>
                <Text style={styles.avatarLargeText}>
                  {selectedPerson?.initial}
                </Text>
              </View>
              <View>
                <Text style={styles.modalTitle}>{selectedPerson?.name}</Text>
                <Text style={styles.modalRole}>{selectedPerson?.role}</Text>
              </View>
            </View>

            <Text style={styles.modalDesc}>{selectedPerson?.detail}</Text>
            <View style={styles.modalCardWarm}>
              <Text style={styles.modalWarmTitle}>Gentle Cue</Text>
              <Text style={styles.modalWarmText}>{selectedPerson?.note}</Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.actionBtnOutline}
                onPress={() => {
                  showToast('Reminder added to tomorrow\'s rhythm', 'success');
                  selectPerson(null);
                }}
              >
                <Text style={styles.actionBtnOutlineText}>Plan shared time</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtnSolid}
                onPress={() => selectPerson(null)}
              >
                <Text style={styles.actionBtnSolidText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  tabsContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  introCard: {
    backgroundColor: colors.surfaceWarm,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  introKicker: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.muted,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  introText: {
    fontSize: 12,
    color: colors.inkSecondary,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  list: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderDark,
    marginRight: spacing.sm,
  },
  avatarText: {
    fontSize: 16,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  personInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: spacing.xs,
  },
  personName: {
    fontSize: 15,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  scopeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  scopeWork: {
    backgroundColor: '#e3eaf3',
  },
  scopePersonal: {
    backgroundColor: '#faebe5',
  },
  scopeText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
    textTransform: 'capitalize',
  },
  personRole: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  personCue: {
    fontSize: 12,
    color: colors.inkSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  arrowIcon: {
    fontSize: 14,
    color: colors.muted,
  },
  msgCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  msgHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  msgSender: {
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  msgPlatform: {
    fontSize: 11,
    color: colors.muted,
  },
  msgText: {
    fontSize: 13,
    color: colors.inkSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  draftBox: {
    backgroundColor: colors.surfaceWarm,
    padding: 10,
    borderRadius: radii.md,
    marginBottom: 8,
  },
  draftLabel: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.muted,
    letterSpacing: 1.1,
    marginBottom: 2,
  },
  draftText: {
    fontSize: 12,
    color: colors.ink,
    fontStyle: 'italic',
  },
  msgActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  nudgeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  nudgeBtnText: {
    fontSize: 12,
    color: colors.muted,
  },
  reviewBtn: {
    backgroundColor: colors.ink,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
  },
  reviewBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  avatarLarge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  avatarLargeText: {
    fontSize: 22,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: typography.fontFamily.serifRegular,
    color: colors.ink,
  },
  modalRole: {
    fontSize: 12,
    color: colors.muted,
  },
  modalDesc: {
    fontSize: 14,
    color: colors.inkSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  modalCardWarm: {
    backgroundColor: colors.surfaceWarm,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.lg,
  },
  modalWarmTitle: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modalWarmText: {
    fontSize: 13,
    color: colors.ink,
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  actionBtnOutline: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  actionBtnOutlineText: {
    fontSize: 13,
    color: colors.accent,
    fontFamily: typography.fontFamily.uiMedium,
  },
  actionBtnSolid: {
    backgroundColor: colors.ink,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radii.pill,
  },
  actionBtnSolidText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
  },
});
