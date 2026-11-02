import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useWorkStore } from './work.store';
import { AppHeader } from '../navigation/AppHeader';
import { PillTabs } from '../../shared/components/PillTabs';
import { WorkTab } from './work.types';
import { WORK_KPIS } from './work.mock';
import { colors, radii, spacing, typography } from '../../shared/theme/tokens';
import { useToast } from '../../shared/components/Toast';

const WORK_TABS: { id: WorkTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'projects', label: 'Projects' },
  { id: 'finance', label: 'Financial' },
  { id: 'hr', label: 'HR & Team' },
  { id: 'sales', label: 'Sales' },
  { id: 'ea', label: 'My EA' },
];

export const WorkScreen: React.FC = () => {
  const { currentTab, setTab, projects, selectedProject, selectProject } = useWorkStore();
  const { showToast } = useToast();

  return (
    <View style={styles.container}>
      <AppHeader
        kicker="ENTERPRISE & PROJECTS · FOCUS"
        title="Leadership clarity."
        subtitle="Active ventures, partner commitments and daily operational signals."
      />

      <View style={styles.tabsContainer}>
        <PillTabs
          tabs={WORK_TABS}
          activeTab={currentTab}
          onSelect={(t) => setTab(t as WorkTab)}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {currentTab === 'overview' && (
          <View style={styles.section}>
            {/* KPI Grid */}
            <View style={styles.kpiGrid}>
              {WORK_KPIS.map((kpi, idx) => (
                <View key={idx} style={styles.kpiCard}>
                  <Text style={styles.kpiLabel}>{kpi.label}</Text>
                  <Text style={styles.kpiValue}>{kpi.value}</Text>
                  <Text style={styles.kpiDetail}>{kpi.detail}</Text>
                </View>
              ))}
            </View>

            {/* EA Signals Card */}
            <View style={styles.cardLilac}>
              <Text style={styles.cardKicker}>EXECUTIVE ASSISTANT · TODAY'S SIGNALS</Text>
              <Text style={styles.eaTitle}>3 priority signals extracted from Email & WhatsApp</Text>
              <Text style={styles.eaDesc}>
                Flooring quotation needs your review · AKC athletics schedule inquiry ·
                School partner contract pending.
              </Text>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => showToast('Navigating to review queue', 'info')}
              >
                <Text style={styles.actionBtnText}>Review priority actions ↗</Text>
              </TouchableOpacity>
            </View>

            {/* Active Projects List */}
            <Text style={styles.sectionTitle}>Key Projects</Text>
            {projects.map((proj) => (
              <TouchableOpacity
                key={proj.id}
                style={styles.projectCard}
                onPress={() => selectProject(proj)}
                activeOpacity={0.7}
              >
                <View style={styles.projHeader}>
                  <View>
                    <Text style={styles.projName}>{proj.name}</Text>
                    <Text style={styles.projTag}>{proj.tag} · {proj.subtitle}</Text>
                  </View>
                  <Text style={styles.projProgress}>{proj.progress}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${proj.progress}%` }]} />
                </View>
                <Text style={styles.projNext}>Next: {proj.next}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {currentTab === 'projects' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>All Active Portfolios</Text>
            {projects.map((proj) => (
              <View key={proj.id} style={styles.card}>
                <View style={styles.projHeader}>
                  <Text style={styles.projName}>{proj.name}</Text>
                  <Text style={styles.projProgress}>{proj.progress}%</Text>
                </View>
                <Text style={styles.projTag}>{proj.subtitle}</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${proj.progress}%` }]} />
                </View>
                <Text style={styles.taskTitle}>Upcoming Milestones:</Text>
                {proj.tasks.map((task, i) => (
                  <View key={i} style={styles.taskRow}>
                    <Text style={styles.taskDot}>•</Text>
                    <Text style={styles.taskText}>{task}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {currentTab === 'finance' && (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.cardKicker}>COMMERCIAL CASHFLOW</Text>
              <Text style={styles.kpiValue}>₹14.80 L Outstanding</Text>
              <Text style={styles.eaDesc}>
                KinderSports schools: ₹8.4 L · Manjalpur initial deposit: ₹4.2 L · Sponsorships: ₹2.2 L
              </Text>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => showToast('Generated reminder invoices', 'success')}
              >
                <Text style={styles.actionBtnText}>Send polite payment reminders ↗</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {currentTab === 'hr' && (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.cardKicker}>TEAM & ATTENDANCE</Text>
              <Text style={styles.kpiValue}>18 / 20 Active Today</Text>
              <Text style={styles.eaDesc}>
                Coaching staff at field: 12 · Operations: 4 · Management: 2{'\n'}
                2 on approved leave.
              </Text>
            </View>
          </View>
        )}

        {currentTab === 'sales' && (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.cardKicker}>INSTITUTIONAL PIPELINE</Text>
              <Text style={styles.kpiValue}>8 Schools in Demo Stage</Text>
              <Text style={styles.eaDesc}>
                Vibgyor High demo next Tuesday · EuroSchool proposal sent yesterday.
              </Text>
            </View>
          </View>
        )}

        {currentTab === 'ea' && (
          <View style={styles.section}>
            <View style={styles.cardWarm}>
              <Text style={styles.cardKicker}>MY EXECUTIVE ASSISTANT</Text>
              <Text style={styles.eaTitle}>Today's Unresolved Commitments</Text>
              <Text style={styles.eaDesc}>
                1. Review flooring vendor revised rates (from Email).{'\n'}
                2. Reply to School Coordinator athletics schedule (from WhatsApp).{'\n'}
                3. Finalize KinderSports RFP draft.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Project Detail Modal */}
      <Modal visible={!!selectedProject} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{selectedProject?.name}</Text>
            <Text style={styles.projTag}>
              {selectedProject?.tag} · {selectedProject?.subtitle}
            </Text>
            <Text style={styles.nextStepHeader}>Next Immediate Action:</Text>
            <Text style={styles.nextStepText}>{selectedProject?.next}</Text>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => selectProject(null)}
            >
              <Text style={styles.doneBtnText}>Close</Text>
            </TouchableOpacity>
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
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
    marginVertical: spacing.xs,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  kpiLabel: {
    fontSize: 11,
    color: colors.muted,
  },
  kpiValue: {
    fontSize: 18,
    fontFamily: typography.fontFamily.serifRegular,
    color: colors.ink,
    marginTop: 2,
  },
  kpiDetail: {
    fontSize: 11,
    color: colors.accent,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardLilac: {
    backgroundColor: '#edf0f6',
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#dce2ee',
  },
  cardWarm: {
    backgroundColor: colors.surfaceWarm,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardKicker: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.muted,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  eaTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  eaDesc: {
    fontSize: 12,
    color: colors.inkSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  actionBtn: {
    marginTop: spacing.sm,
  },
  actionBtnText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.accent,
  },
  projectCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  projHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projName: {
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  projTag: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  projProgress: {
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.accent,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.surfaceWarm,
    borderRadius: 3,
    marginVertical: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.ink,
  },
  projNext: {
    fontSize: 12,
    color: colors.inkSecondary,
    fontStyle: 'italic',
  },
  taskTitle: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
    marginTop: 8,
    marginBottom: 4,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  taskDot: {
    color: colors.muted,
  },
  taskText: {
    fontSize: 12,
    color: colors.inkSecondary,
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
  modalTitle: {
    fontSize: 18,
    fontFamily: typography.fontFamily.serifRegular,
    color: colors.ink,
  },
  nextStepHeader: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.muted,
    textTransform: 'uppercase',
    marginTop: spacing.md,
  },
  nextStepText: {
    fontSize: 14,
    color: colors.ink,
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  doneBtn: {
    backgroundColor: colors.surfaceWarm,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radii.pill,
  },
  doneBtnText: {
    color: colors.ink,
    fontFamily: typography.fontFamily.uiMedium,
  },
});
