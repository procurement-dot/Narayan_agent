import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { useCalendarStore } from './calendar.store';
import { useNavigationStore } from '../navigation/navigation.store';
import { CalendarEvent } from './calendar.types';
import { useToast } from '../../shared/components/Toast';

const UNIT = 86; // 86px per hour (exact match to HTML prototype)
const START_HOUR = 5;
const LAST_HOUR = 25;

export const CalendarScreen: React.FC = () => {
  const {
    events,
    mode,
    setMode,
    isAddTaskOpen,
    openAddTask,
    closeAddTask,
    addEvent,
    selectedEvent,
    selectEvent,
  } = useCalendarStore();
  const { openDock } = useNavigationStore();
  const { showToast } = useToast();

  const scrollRef = useRef<ScrollView>(null);

  // Current clock time calculation
  const [nowTime, setNowTime] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setNowTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const nowMinutes = (() => {
    const [h, m] = nowTime.split(':').map(Number);
    return h * 60 + m;
  })();

  const currentHour = Math.floor(nowMinutes / 60);

  // Scroll to current time on mount
  useEffect(() => {
    if (mode === 'timeline') {
      const targetY = Math.max(0, (nowMinutes - START_HOUR * 60) * (UNIT / 60) - 220);
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: targetY, animated: true });
      }, 300);
    }
  }, [mode]);

  // Add Task Form state
  const [newTitle, setNewTitle] = useState('');
  const [newStart, setNewStart] = useState('14:00');
  const [newEnd, setNewEnd] = useState('15:00');
  const [newCat, setNewCat] = useState<'peach' | 'green' | 'purple' | 'gray'>('peach');

  const handleSaveTask = () => {
    if (!newTitle.trim()) {
      showToast('Please enter a task title', 'warning');
      return;
    }
    addEvent({
      title: newTitle.trim(),
      subtitle: 'Added to your rhythm',
      start: newStart,
      end: newEnd,
      cat: newCat,
      kind: 'work',
    });
    setNewTitle('');
    closeAddTask();
    showToast('Added to Calendar', 'success');
  };

  const getCatStyles = (cat: CalendarEvent['cat']) => {
    switch (cat) {
      case 'green':
        return { bg: '#ecf3ee', border: '#89aa94' };
      case 'peach':
        return { bg: '#fcf1ec', border: '#d4805c' };
      case 'purple':
        return { bg: '#f1eff7', border: '#a69bbe' };
      case 'gray':
      default:
        return { bg: '#f1f2ef', border: '#afb4ae' };
    }
  };

  const nowLineY = (nowMinutes - START_HOUR * 60) * (UNIT / 60);

  return (
    <View style={styles.container}>
      {/* Top Bar with Brand & Day Stamp */}
      <View style={styles.topHeader}>
        <View style={styles.brandRow}>
          <TouchableOpacity onPress={openDock} style={styles.menuBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          <View style={styles.brandContainer}>
            <Text style={styles.brandText}>NRYN</Text>
            <View style={styles.brandSun} />
          </View>
        </View>

        <View style={styles.dayStamp}>
          <Text style={styles.dayStampText}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()}
          </Text>
          <Text style={styles.dayStampSub}>Today · Live time</Text>

          {/* Day / Calendar toggle */}
          <View style={styles.dayToggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === 'timeline' && styles.toggleBtnActive]}
              onPress={() => setMode('timeline')}
            >
              <Text style={[styles.toggleText, mode === 'timeline' && styles.toggleTextActive]}>
                Day
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === 'month' && styles.toggleBtnActive]}
              onPress={() => setMode('month')}
            >
              <Text style={[styles.toggleText, mode === 'month' && styles.toggleTextActive]}>
                Calendar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Content: 24-Hour Rolling Clock or Month View */}
      {mode === 'timeline' ? (
        <ScrollView
          ref={scrollRef}
          style={styles.timelineScroll}
          contentContainerStyle={styles.timelineContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.clockTrack}>
            {/* Hour digits and horizontal lines */}
            {Array.from({ length: LAST_HOUR - START_HOUR + 1 }).map((_, i) => {
              const hour = START_HOUR + i;
              const isNear = hour === currentHour;
              const topPos = i * UNIT;
              return (
                <View key={hour} style={[styles.hourRow, { top: topPos }]}>
                  <Text style={[styles.hourDigit, isNear && styles.hourDigitNear]}>
                    {String(hour % 24).padStart(2, '0')}
                  </Text>
                  <View style={styles.hourRule} />
                </View>
              );
            })}

            {/* Vertical timeline track line at left 82px */}
            <View style={styles.verticalTrack} />

            {/* Plus buttons between hours to add tasks */}
            {Array.from({ length: LAST_HOUR - START_HOUR }).map((_, i) => {
              const hour = START_HOUR + i;
              const topPos = i * UNIT + 12;
              return (
                <TouchableOpacity
                  key={`slot-${hour}`}
                  style={[styles.slotBtn, { top: topPos }]}
                  onPress={() => {
                    setNewStart(`${String(hour % 24).padStart(2, '0')}:00`);
                    setNewEnd(`${String((hour + 1) % 24).padStart(2, '0')}:00`);
                    openAddTask();
                  }}
                  activeOpacity={0.6}
                >
                  <Text style={styles.slotBtnText}>＋</Text>
                </TouchableOpacity>
              );
            })}

            {/* Live Terracotta NOW Line */}
            {nowMinutes >= START_HOUR * 60 && nowMinutes <= LAST_HOUR * 60 && (
              <View style={[styles.nowLine, { top: nowLineY }]}>
                <View style={styles.nowBadge}>
                  <Text style={styles.nowBadgeText}>{nowTime}</Text>
                </View>
                <View style={styles.nowDot} />
                <View style={styles.nowRule} />
              </View>
            )}

            {/* Intention Event Cards - Authentic HTML Minimal Transparent Layout */}
            {events.map((e) => {
              const [sh, sm] = e.start.split(':').map(Number);
              const [eh, em] = e.end.split(':').map(Number);
              const startM = sh * 60 + sm;
              const endM = eh * 60 + em;
              const top = (startM - START_HOUR * 60) * (UNIT / 60) + 14;
              const durationM = endM - startM;
              const span = (durationM * UNIT) / 60;
              const height = Math.max(42, Math.min(106, span - 8));

              if (top < 0) return null;

              return (
                <TouchableOpacity
                  key={e.id}
                  style={[
                    styles.intentionCard,
                    {
                      top,
                      minHeight: height,
                    },
                  ]}
                  onPress={() => selectEvent(e)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.intentionTime}>
                    {e.start} – {e.end}
                  </Text>
                  <Text style={styles.intentionName}>
                    {e.title}
                  </Text>
                  {e.subtitle ? (
                    <Text style={styles.intentionSub}>
                      {e.subtitle}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      ) : (
        /* Month View */
        <ScrollView style={styles.monthScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.monthCard}>
            <View style={styles.monthNavRow}>
              <TouchableOpacity style={styles.monthNavBtn}>
                <Text style={styles.monthNavBtnText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthTitle}>November 2026</Text>
              <TouchableOpacity style={styles.monthNavBtn}>
                <Text style={styles.monthNavBtnText}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.weekdaysRow}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                <Text key={i} style={styles.weekdayText}>
                  {day}
                </Text>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.daysGrid}>
              {Array.from({ length: 30 }).map((_, i) => {
                const dayNum = i + 1;
                const isToday = dayNum === 2;
                const hasDot = [2, 4, 6, 10, 15, 20, 24].includes(dayNum);
                return (
                  <View key={dayNum} style={[styles.dayCell, isToday && styles.dayCellToday]}>
                    <Text style={[styles.dayCellText, isToday && styles.dayCellTextToday]}>
                      {dayNum}
                    </Text>
                    {hasDot && <View style={[styles.cellDot, isToday && styles.cellDotToday]} />}
                  </View>
                );
              })}
            </View>

            {/* Agenda for Selected Day */}
            <View style={styles.agendaBox}>
              <Text style={styles.agendaDate}>TODAY · 2 NOVEMBER</Text>
              {events.slice(0, 4).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.agendaItem}
                  onPress={() => selectEvent(item)}
                >
                  <Text style={styles.agendaTime}>{item.start}</Text>
                  <View style={styles.agendaInfo}>
                    <Text style={styles.agendaTitle}>{item.title}</Text>
                    <Text style={styles.agendaSub}>{item.subtitle}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      {/* Add Task Modal */}
      <Modal visible={isAddTaskOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add to your rhythm</Text>

            <Text style={styles.fieldLabel}>Task Name</Text>
            <TextInput
              style={styles.input}
              placeholder="What needs to happen?"
              value={newTitle}
              onChangeText={setNewTitle}
              placeholderTextColor="#9ca39c"
            />

            <View style={styles.timeRow}>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>From</Text>
                <TextInput style={styles.input} value={newStart} onChangeText={setNewStart} />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>To</Text>
                <TextInput style={styles.input} value={newEnd} onChangeText={setNewEnd} />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.colorPills}>
              {(['peach', 'green', 'purple', 'gray'] as const).map((c) => {
                const s = getCatStyles(c);
                return (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorPill,
                      { backgroundColor: s.bg, borderColor: s.border },
                      newCat === c && styles.selectedColorPill,
                    ]}
                    onPress={() => setNewCat(c)}
                  >
                    <Text style={styles.colorPillText}>{c}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeAddTask}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveTask}>
                <Text style={styles.saveBtnText}>Save Task</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Event Detail Modal */}
      <Modal visible={!!selectedEvent} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{selectedEvent?.title}</Text>
            <Text style={styles.eventTimeSpan}>
              {selectedEvent?.start} – {selectedEvent?.end}
            </Text>
            <Text style={styles.eventModalDesc}>{selectedEvent?.subtitle}</Text>
            <TouchableOpacity style={styles.doneBtn} onPress={() => selectEvent(null)}>
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
    backgroundColor: '#fcfbf8',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: '#fcfbf8',
    zIndex: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuBtn: {
    padding: 4,
  },
  menuIcon: {
    fontSize: 20,
    color: '#343c36',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  brandText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 4,
    color: '#292e29',
  },
  brandSun: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#d18c70',
    marginLeft: 3,
    marginBottom: 6,
  },
  dayStamp: {
    alignItems: 'flex-end',
  },
  dayStampText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#7d877f',
  },
  dayStampSub: {
    fontSize: 10,
    color: '#a6aca4',
    marginTop: 1,
    marginBottom: 6,
  },
  dayToggle: {
    flexDirection: 'row',
    backgroundColor: '#eff1ee',
    borderRadius: 999,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  toggleBtnActive: {
    backgroundColor: '#27382d',
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7e8880',
  },
  toggleTextActive: {
    color: '#ffffff',
  },
  timelineScroll: {
    flex: 1,
  },
  timelineContent: {
    height: (LAST_HOUR - START_HOUR + 1) * UNIT + 40,
    paddingBottom: 100,
  },
  clockTrack: {
    position: 'relative',
    height: (LAST_HOUR - START_HOUR + 1) * UNIT,
    marginHorizontal: 16,
  },
  hourRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    height: UNIT,
  },
  hourDigit: {
    width: 80,
    fontSize: 52,
    fontWeight: '200',
    color: '#c2c6be',
    letterSpacing: -3,
    transform: [{ translateY: -20 }],
    textAlign: 'center',
  },
  hourDigitNear: {
    color: '#bd745b',
    fontWeight: '400',
  },
  hourRule: {
    flex: 1,
    height: 1,
    backgroundColor: '#ededeb',
    marginTop: 8,
  },
  verticalTrack: {
    position: 'absolute',
    left: 82,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#eaeae4',
  },
  slotBtn: {
    position: 'absolute',
    left: 82,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  slotBtnText: {
    fontSize: 14,
    color: '#c0c6be',
  },
  nowLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 5,
  },
  nowBadge: {
    width: 76,
    backgroundColor: '#fcfbf8',
    paddingVertical: 1,
  },
  nowBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#c37c5d',
    letterSpacing: -0.3,
  },
  nowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ca8268',
    borderWidth: 2,
    borderColor: '#fcfbf8',
    position: 'absolute',
    left: 78,
  },
  nowRule: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#ce9378',
    marginLeft: 14,
  },
  intentionCard: {
    position: 'absolute',
    left: 104,
    right: 8,
    maxWidth: 540,
    backgroundColor: 'transparent',
    paddingVertical: 1,
    paddingHorizontal: 0,
    borderWidth: 0,
    justifyContent: 'flex-start',
    zIndex: 3,
  },
  intentionTime: {
    fontSize: 10,
    color: '#b37b63',
    letterSpacing: 0.4,
    fontWeight: '600',
    marginBottom: 2,
  },
  intentionName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#303934',
    letterSpacing: -0.3,
    lineHeight: 20,
  },
  intentionSub: {
    fontSize: 11,
    color: '#969d96',
    lineHeight: 16,
    marginTop: 2,
  },
  monthScroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  monthCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#e8ebe6',
    padding: 18,
    marginBottom: 40,
  },
  monthNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  monthNavBtn: {
    padding: 8,
  },
  monthNavBtnText: {
    fontSize: 22,
    color: '#657367',
  },
  monthTitle: {
    fontSize: 17,
    fontFamily: 'Georgia',
    color: '#292e29',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  weekdayText: {
    fontSize: 11,
    color: '#9ca49c',
    width: 38,
    textAlign: 'center',
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  dayCell: {
    width: '13%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  dayCellToday: {
    backgroundColor: '#27382d',
  },
  dayCellText: {
    fontSize: 13,
    color: '#303934',
    fontWeight: '500',
  },
  dayCellTextToday: {
    color: '#ffffff',
    fontWeight: '700',
  },
  cellDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d4805c',
    marginTop: 2,
  },
  cellDotToday: {
    backgroundColor: '#ffffff',
  },
  agendaBox: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f2ee',
    paddingTop: 14,
  },
  agendaDate: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#9ba39c',
    marginBottom: 10,
  },
  agendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f7f8f6',
  },
  agendaTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#b37b63',
    width: 55,
  },
  agendaInfo: {
    flex: 1,
  },
  agendaTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#303934',
  },
  agendaSub: {
    fontSize: 11,
    color: '#8d968d',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 35, 28, 0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fcfbf8',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d2d7cf',
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'Georgia',
    color: '#292e29',
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#738075',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e7e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#292e29',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  colorPills: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    marginBottom: 16,
  },
  colorPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  selectedColorPill: {
    borderWidth: 2,
    borderColor: '#292e29',
  },
  colorPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#292e29',
    textTransform: 'capitalize',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 10,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    color: '#738075',
    fontSize: 13,
  },
  saveBtn: {
    backgroundColor: '#27382d',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 999,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  eventTimeSpan: {
    fontSize: 13,
    color: '#cd8167',
    marginBottom: 8,
  },
  eventModalDesc: {
    fontSize: 14,
    color: '#525a52',
    lineHeight: 20,
    marginBottom: 20,
  },
  doneBtn: {
    backgroundColor: '#f1eee7',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 999,
  },
  doneBtnText: {
    color: '#292e29',
    fontWeight: '600',
  },
});
