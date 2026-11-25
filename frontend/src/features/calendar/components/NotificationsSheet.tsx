import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useCalendarStore } from '../calendar.store';
import { CalendarNotificationItem } from '../calendar.types';
import { useToast } from '../../../shared/components/Toast';

type FilterTab = 'all' | 'meeting' | 'task' | 'bill';

export const NotificationsSheet: React.FC = () => {
  const {
    notifications,
    isNotificationsOpen,
    closeNotifications,
    acceptNotification,
    dismissNotification,
    isLoadingNotifications,
  } = useCalendarStore();

  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [actingId, setActingId] = useState<string | null>(null);

  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'meeting') return item.type === 'meeting';
    if (activeTab === 'task') return item.type === 'task';
    if (activeTab === 'bill') return item.type === 'bill';
    return true;
  });

  const counts = {
    all: notifications.length,
    meeting: notifications.filter((n) => n.type === 'meeting').length,
    task: notifications.filter((n) => n.type === 'task').length,
    bill: notifications.filter((n) => n.type === 'bill').length,
  };

  const handleAccept = async (item: CalendarNotificationItem) => {
    try {
      setActingId(item.id);
      await acceptNotification(item);
      showToast('Added to Calendar Rhythm ✓', 'success');
    } catch {
      showToast('Could not add to Calendar', 'warning');
    } finally {
      setActingId(null);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      setActingId(id);
      await dismissNotification(id);
      showToast('Approval dismissed', 'info');
    } catch {
      showToast('Failed to dismiss', 'warning');
    } finally {
      setActingId(null);
    }
  };

  return (
    <Modal visible={isNotificationsOpen} transparent animationType="slide" onRequestClose={closeNotifications}>
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          {/* Drag Handle */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleWithBadge}>
              <Text style={styles.sheetTitle}>🔔 Approvals</Text>
              {notifications.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{notifications.length}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={closeNotifications} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sheetSubtitle}>
            Cross-module intelligence. Review meetings, tasks & bill reminders before adding to your rhythm.
          </Text>

          {/* Filter Pills */}
          <View style={styles.filterPillsRow}>
            <TouchableOpacity
              style={[styles.filterPill, activeTab === 'all' && styles.filterPillActive]}
              onPress={() => setActiveTab('all')}
            >
              <Text style={[styles.filterPillText, activeTab === 'all' && styles.filterPillTextActive]}>
                All ({counts.all})
              </Text>
            </TouchableOpacity>

            {counts.meeting > 0 && (
              <TouchableOpacity
                style={[styles.filterPill, activeTab === 'meeting' && styles.filterPillActive]}
                onPress={() => setActiveTab('meeting')}
              >
                <Text style={[styles.filterPillText, activeTab === 'meeting' && styles.filterPillTextActive]}>
                  Meetings ✉ ({counts.meeting})
                </Text>
              </TouchableOpacity>
            )}

            {counts.task > 0 && (
              <TouchableOpacity
                style={[styles.filterPill, activeTab === 'task' && styles.filterPillActive]}
                onPress={() => setActiveTab('task')}
              >
                <Text style={[styles.filterPillText, activeTab === 'task' && styles.filterPillTextActive]}>
                  Tasks 📋 ({counts.task})
                </Text>
              </TouchableOpacity>
            )}

            {counts.bill > 0 && (
              <TouchableOpacity
                style={[styles.filterPill, activeTab === 'bill' && styles.filterPillActive]}
                onPress={() => setActiveTab('bill')}
              >
                <Text style={[styles.filterPillText, activeTab === 'bill' && styles.filterPillTextActive]}>
                  Bills 💳 ({counts.bill})
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Notifications List */}
          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {isLoadingNotifications ? (
              <View style={styles.emptyContainer}>
                <ActivityIndicator size="small" color="#2d5a3e" />
                <Text style={styles.emptyText}>Loading approvals...</Text>
              </View>
            ) : filteredNotifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>✓</Text>
                <Text style={styles.emptyTitle}>All caught up!</Text>
                <Text style={styles.emptyText}>
                  No pending approvals. All meetings, tasks and bills are already reviewed.
                </Text>
              </View>
            ) : (
              filteredNotifications.map((item) => {
                const isActing = actingId === item.id;
                const isMeeting = item.type === 'meeting';
                const isBill = item.type === 'bill';

                const sourceTag = isMeeting
                  ? { label: '✉ Email Meeting', bg: '#fcf1ec', border: '#d4805c', text: '#b35d38' }
                  : isBill
                  ? { label: '💳 Bill Reminder', bg: '#fff6eb', border: '#e3a968', text: '#a6631b' }
                  : item.source === 'notes_mom'
                  ? { label: '📝 Notes MoM', bg: '#eef6f3', border: '#84b8a2', text: '#27694f' }
                  : { label: '📋 Action Task', bg: '#f1eff7', border: '#a69bbe', text: '#6548a8' };

                return (
                  <View key={item.id} style={styles.card}>
                    {/* Top Row: Module Badge & Slot */}
                    <View style={styles.cardHeaderRow}>
                      <View
                        style={[
                          styles.sourceBadge,
                          { backgroundColor: sourceTag.bg, borderColor: sourceTag.border },
                        ]}
                      >
                        <Text style={[styles.sourceBadgeText, { color: sourceTag.text }]}>
                          {sourceTag.label}
                        </Text>
                      </View>
                      <View style={styles.slotBadge}>
                        <Text style={styles.slotBadgeText}>
                          {item.startTime} – {item.endTime}
                        </Text>
                      </View>
                    </View>

                    {/* Title & Subtitle */}
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    {item.subtitle ? <Text style={styles.cardSubtitle}>{item.subtitle}</Text> : null}

                    {/* Sender or Details */}
                    {item.sender ? (
                      <Text style={styles.senderText}>From: {item.sender}</Text>
                    ) : null}

                    {/* Evidence Box */}
                    {item.evidence ? (
                      <View style={styles.evidenceBox}>
                        <Text style={styles.evidenceLabel}>AI Quotation / Context:</Text>
                        <Text style={styles.evidenceContent}>"{item.evidence}"</Text>
                      </View>
                    ) : item.detail ? (
                      <View style={styles.evidenceBox}>
                        <Text style={styles.evidenceContent}>{item.detail}</Text>
                      </View>
                    ) : null}

                    {/* Action Buttons */}
                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        style={[styles.acceptBtn, isActing && styles.btnDisabled]}
                        onPress={() => handleAccept(item)}
                        disabled={isActing}
                        activeOpacity={0.8}
                      >
                        {isActing ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <Text style={styles.acceptBtnText}>Add to Calendar ✓</Text>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.dismissBtn, isActing && styles.btnDisabled]}
                        onPress={() => handleDismiss(item.id)}
                        disabled={isActing}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.dismissBtnText}>Dismiss ✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 26, 23, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: '45%',
    paddingBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 12,
  },
  handleBar: {
    width: 44,
    height: 4,
    backgroundColor: '#d8ded8',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 4,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a241c',
    letterSpacing: -0.3,
  },
  countBadge: {
    backgroundColor: '#d4805c',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f4f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: '#495249',
    fontWeight: '600',
  },
  sheetSubtitle: {
    fontSize: 13,
    color: '#6e776e',
    paddingHorizontal: 20,
    marginTop: 2,
    marginBottom: 12,
    lineHeight: 18,
  },
  filterPillsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f5f3',
    borderWidth: 1,
    borderColor: '#e2e7e2',
  },
  filterPillActive: {
    backgroundColor: '#27382d',
    borderColor: '#27382d',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4d574d',
  },
  filterPillTextActive: {
    color: '#ffffff',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 24,
    gap: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 44,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 32,
    color: '#3d7a52',
    marginBottom: 8,
    fontWeight: '700',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#27382d',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    color: '#717c71',
    textAlign: 'center',
    lineHeight: 19,
  },
  card: {
    backgroundColor: '#fafbfa',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e7ebe7',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  sourceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  slotBadge: {
    backgroundColor: '#edf2ed',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  slotBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#344034',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a241c',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#555f55',
    marginBottom: 4,
    lineHeight: 18,
  },
  senderText: {
    fontSize: 12,
    color: '#7a857a',
    marginBottom: 8,
  },
  evidenceBox: {
    backgroundColor: '#f2f5f2',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#8ca68c',
  },
  evidenceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4f5e4f',
    marginBottom: 2,
  },
  evidenceContent: {
    fontSize: 12,
    color: '#384238',
    fontStyle: 'italic',
    lineHeight: 17,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: '#27382d',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  dismissBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f0f3f0',
    borderWidth: 1,
    borderColor: '#dde3dd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissBtnText: {
    color: '#5e685e',
    fontSize: 13,
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
