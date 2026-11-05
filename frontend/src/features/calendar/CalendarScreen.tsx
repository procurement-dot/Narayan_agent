import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
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
    selectedDate,
    setSelectedDate,
    monthOverview,
    monthViewDate,
    setMonthViewDate,
    isAddTaskOpen,
    openAddTask,
    closeAddTask,
    addEvent,
    deleteEvent,
    selectedEvent,
    selectEvent,
    fetchDayEvents,
    fetchMonthOverview,
    syncGoogleCalendar,
    isSyncing,
  } = useCalendarStore();

  const { openDock } = useNavigationStore();
  const { showToast } = useToast();

  const scrollRef = useRef<ScrollView>(null);

  // Fetch initial day events and month overview
  useEffect(() => {
    fetchDayEvents();
    fetchMonthOverview();
  }, []);

  // Today string
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const isSelectedToday = selectedDate === todayStr;

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

  // Scroll to current time on mount in timeline mode
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
  const [newDetail, setNewDetail] = useState('');
  const [newStart, setNewStart] = useState('14:00');
  const [newEnd, setNewEnd] = useState('15:00');
  const [newCat, setNewCat] = useState<'peach' | 'green' | 'purple' | 'gray'>('peach');
  const [syncToGoogle, setSyncToGoogle] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveTask = async () => {
    if (!newTitle.trim()) {
      showToast('Please enter a task title', 'warning');
      return;
    }
    try {
      setIsSaving(true);
      await addEvent({
        title: newTitle.trim(),
        subtitle: 'Scheduled rhythm',
        detail: newDetail.trim() || undefined,
        start: newStart,
        end: newEnd,
        cat: newCat,
        kind: 'work',
        date: selectedDate,
        syncToGoogle,
      });
      setNewTitle('');
      setNewDetail('');
      setSyncToGoogle(false);
      closeAddTask();
      showToast('Added to Calendar', 'success');
    } catch (err: any) {
      showToast('Could not save task', 'warning');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedEvent) return;
    try {
      const eventId = selectedEvent.id;
      selectEvent(null);
      await deleteEvent(eventId);
      showToast('Task removed', 'info');
    } catch (err) {
      showToast('Failed to delete task', 'warning');
    }
  };

  const handleConfirmToCalendar = async (item: CalendarEvent) => {
    try {
      await addEvent({
        title: item.title,
        subtitle: item.subtitle,
        detail: item.detail,
        start: item.start,
        end: item.end,
        cat: item.cat,
        kind: item.kind,
        date: item.date || selectedDate,
      });
      selectEvent(null);
      showToast('Confirmed & Added to Calendar Rhythm', 'success');
    } catch {
      showToast('Could not save to Calendar', 'warning');
    }
  };

  const crossModuleCounts = useMemo(() => {
    let meetings = 0;
    let emailTasks = 0;
    let notesItems = 0;
    let healthItems = 0;
    let googleItems = 0;

    for (const e of events) {
      if (e.source === 'email_meeting') meetings++;
      else if (e.source === 'email_proposal') emailTasks++;
      else if (e.source === 'notes_mom' || e.source === 'notes_action') notesItems++;
      else if (e.source === 'health_event') healthItems++;
      else if (e.source === 'google_calendar') googleItems++;
    }

    return {
      meetings,
      emailTasks,
      notesItems,
      healthItems,
      googleItems,
      total: meetings + emailTasks + notesItems + healthItems + googleItems,
    };
  }, [events]);

  // Collision-aware layout positions for overlapping events
  const layoutEvents = useMemo(() => {
    const mapped = events.map((e) => {
      const [sh, sm] = (e.start || '09:00').split(':').map(Number);
      const [eh, em] = (e.end || '10:00').split(':').map(Number);
      const startM = (sh || 0) * 60 + (sm || 0);
      const endM = (eh || 0) * 60 + (em || 0);
      return {
        ...e,
        startM,
        endM: Math.max(startM + 25, endM),
      };
    }).sort((a, b) => a.startM - b.startM);

    const clusters: Array<typeof mapped> = [];
    let currentCluster: typeof mapped = [];
    let clusterEnd = -1;

    for (const ev of mapped) {
      if (currentCluster.length === 0) {
        currentCluster.push(ev);
        clusterEnd = ev.endM;
      } else if (ev.startM < clusterEnd) {
        currentCluster.push(ev);
        clusterEnd = Math.max(clusterEnd, ev.endM);
      } else {
        clusters.push(currentCluster);
        currentCluster = [ev];
        clusterEnd = ev.endM;
      }
    }
    if (currentCluster.length > 0) clusters.push(currentCluster);

    const result: Array<typeof mapped[0] & { colIndex: number; totalCols: number }> = [];

    for (const cluster of clusters) {
      const totalCols = Math.min(cluster.length, 2);
      cluster.forEach((ev, idx) => {
        result.push({
          ...ev,
          colIndex: idx % totalCols,
          totalCols,
        });
      });
    }

    return result;
  }, [events]);

  const handleManualSync = async () => {
    try {
      showToast('Syncing with Google Calendar...', 'info');
      const res = await syncGoogleCalendar();
      if (res?.result?.warning === 'GOOGLE_CALENDAR_DISABLED') {
        showToast('Google Calendar API not enabled in Google Cloud Console', 'warning');
        console.warn('To enable Google Calendar API, open: https://console.developers.google.com/apis/api/calendar-json.googleapis.com/overview?project=333616927198');
      } else if (res && res.result && res.result.synced > 0) {
        showToast(`Synced ${res.result.synced} events from Google Calendar`, 'success');
      } else {
        showToast('Calendar is up to date', 'info');
      }
    } catch (err: any) {
      showToast('Could not sync calendar', 'warning');
    }
  };

  // Month navigation helpers
  const handlePrevMonth = () => {
    const prevM = monthViewDate.month === 1 ? 12 : monthViewDate.month - 1;
    const prevY = monthViewDate.month === 1 ? monthViewDate.year - 1 : monthViewDate.year;
    setMonthViewDate(prevY, prevM);
  };

  const handleNextMonth = () => {
    const nextM = monthViewDate.month === 12 ? 1 : monthViewDate.month + 1;
    const nextY = monthViewDate.month === 12 ? monthViewDate.year + 1 : monthViewDate.year;
    setMonthViewDate(nextY, nextM);
  };

  const monthTitleStr = useMemo(() => {
    const d = new Date(monthViewDate.year, monthViewDate.month - 1, 1);
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }, [monthViewDate.year, monthViewDate.month]);

  // Calendar Grid generation
  const monthGridDays = useMemo(() => {
    // 0 = Sunday, 1 = Monday ... 6 = Saturday -> convert to Monday=0
    const rawFirst = new Date(monthViewDate.year, monthViewDate.month - 1, 1).getDay();
    const blankCount = (rawFirst + 6) % 7;
    const totalDays = new Date(monthViewDate.year, monthViewDate.month, 0).getDate();

    const blanks = Array.from({ length: blankCount }).map((_, i) => ({
      key: `blank-${i}`,
      isBlank: true,
      dayNum: 0,
      dateStr: '',
    }));

    const days = Array.from({ length: totalDays }).map((_, i) => {
      const dayNum = i + 1;
      const padM = String(monthViewDate.month).padStart(2, '0');
      const padD = String(dayNum).padStart(2, '0');
      const dateStr = `${monthViewDate.year}-${padM}-${padD}`;
      return {
        key: `day-${dayNum}`,
        isBlank: false,
        dayNum,
        dateStr,
      };
    });

    return [...blanks, ...days];
  }, [monthViewDate.year, monthViewDate.month]);

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

  // Formatted date string for top header
  const displayHeaderDate = useMemo(() => {
    const parts = selectedDate.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).toUpperCase();
  }, [selectedDate]);

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
          <View style={styles.dayStampTopRow}>
            <Text style={styles.dayStampText}>{displayHeaderDate}</Text>
            {!isSelectedToday && (
              <TouchableOpacity
                onPress={() => setSelectedDate(todayStr)}
                style={styles.jumpTodayBtn}
              >
                <Text style={styles.jumpTodayText}>Today</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.dayStampSub}>
            {isSelectedToday ? 'Today · Live time' : 'Selected day'}
          </Text>

          {/* Day / Calendar toggle & Sync */}
          <View style={styles.controlsRow}>
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

            <TouchableOpacity
              style={[styles.syncHeaderBtn, isSyncing && styles.syncHeaderBtnDisabled]}
              onPress={handleManualSync}
              disabled={isSyncing}
              activeOpacity={0.7}
            >
              {isSyncing ? (
                <ActivityIndicator size="small" color="#27382d" />
              ) : (
                <Text style={styles.syncHeaderBtnText}>Sync ↻</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Cross-Module Signals Bar */}
      {crossModuleCounts.total > 0 && (
        <View style={styles.crossModuleBar}>
          <Text style={styles.crossModuleKicker}>SIGNALS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.crossModulePills}>
            {crossModuleCounts.meetings > 0 && (
              <View style={[styles.moduleSignalPill, { backgroundColor: '#fcf1ec', borderColor: '#d4805c' }]}>
                <Text style={[styles.moduleSignalText, { color: '#b35d38' }]}>
                  ✉ {crossModuleCounts.meetings} {crossModuleCounts.meetings === 1 ? 'Meeting' : 'Meetings'}
                </Text>
              </View>
            )}
            {crossModuleCounts.emailTasks > 0 && (
              <View style={[styles.moduleSignalPill, { backgroundColor: '#f1eff7', borderColor: '#a69bbe' }]}>
                <Text style={[styles.moduleSignalText, { color: '#6548a8' }]}>
                  ✉ {crossModuleCounts.emailTasks} Email {crossModuleCounts.emailTasks === 1 ? 'Task' : 'Tasks'}
                </Text>
              </View>
            )}
            {crossModuleCounts.notesItems > 0 && (
              <View style={[styles.moduleSignalPill, { backgroundColor: '#eef6f3', borderColor: '#84b8a2' }]}>
                <Text style={[styles.moduleSignalText, { color: '#27694f' }]}>
                  📝 {crossModuleCounts.notesItems} Notes MoM
                </Text>
              </View>
            )}
            {crossModuleCounts.healthItems > 0 && (
              <View style={[styles.moduleSignalPill, { backgroundColor: '#ecf3ee', borderColor: '#89aa94' }]}>
                <Text style={[styles.moduleSignalText, { color: '#386345' }]}>
                  🏃 {crossModuleCounts.healthItems} Health
                </Text>
              </View>
            )}
            {crossModuleCounts.googleItems > 0 && (
              <View style={[styles.moduleSignalPill, { backgroundColor: '#ecf3ee', borderColor: '#89aa94' }]}>
                <Text style={[styles.moduleSignalText, { color: '#2d6a4f' }]}>
                  📅 {crossModuleCounts.googleItems} Google
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}

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
              const isNear = hour === currentHour && isSelectedToday;
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

            {/* Live Terracotta NOW Line (only shown when viewing today) */}
            {isSelectedToday && nowMinutes >= START_HOUR * 60 && nowMinutes <= LAST_HOUR * 60 && (
              <View style={[styles.nowLine, { top: nowLineY }]}>
                <View style={styles.nowBadge}>
                  <Text style={styles.nowBadgeText}>{nowTime}</Text>
                </View>
                <View style={styles.nowDot} />
                <View style={styles.nowRule} />
              </View>
            )}

            {/* Intention Event Cards */}
            {layoutEvents.map((e) => {
              const [sh, sm] = (e.start || '09:00').split(':').map(Number);
              const [eh, em] = (e.end || '10:00').split(':').map(Number);
              const startM = (sh || 0) * 60 + (sm || 0);
              const endM = (eh || 0) * 60 + (em || 0);
              const top = (startM - START_HOUR * 60) * (UNIT / 60) + 14;
              const durationM = Math.max(20, endM - startM);
              const span = (durationM * UNIT) / 60;
              const height = Math.max(42, Math.min(110, span - 8));

              if (top < 0) return null;

              const isMultiCol = e.totalCols > 1;
              const colStyle = isMultiCol
                ? e.colIndex === 0
                  ? { left: 104, width: '42%' as any }
                  : { left: '54%' as any, right: 10 }
                : { left: 104, right: 12, maxWidth: 520 };

              const borderCol =
                e.cat === 'green'
                  ? '#89aa94'
                  : e.cat === 'purple'
                  ? '#a69bbe'
                  : e.cat === 'gray'
                  ? '#afb4ae'
                  : '#d4805c';

              return (
                <TouchableOpacity
                  key={e.id}
                  style={[
                    styles.intentionCard,
                    colStyle,
                    {
                      top,
                      minHeight: height,
                      borderLeftColor: borderCol,
                    },
                  ]}
                  onPress={() => selectEvent(e)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.intentionTime}>
                      {e.start} – {e.end}
                    </Text>
                    {e.source === 'google_calendar' && (
                      <View style={styles.tagGoogle}>
                        <Text style={styles.tagGoogleText}>Google</Text>
                      </View>
                    )}
                    {e.source === 'email_meeting' && (
                      <View style={styles.tagMeeting}>
                        <Text style={styles.tagMeetingText}>✉ Meeting</Text>
                      </View>
                    )}
                    {e.source === 'email_proposal' && (
                      <View style={styles.tagAction}>
                        <Text style={styles.tagActionText}>✉ Task</Text>
                      </View>
                    )}
                    {e.source === 'notes_mom' && (
                      <View style={styles.tagMom}>
                        <Text style={styles.tagMomText}>📝 MoM</Text>
                      </View>
                    )}
                    {e.source === 'notes_action' && (
                      <View style={styles.tagNoteAction}>
                        <Text style={styles.tagNoteActionText}>📝 Action</Text>
                      </View>
                    )}
                    {e.source === 'health_event' && (
                      <View style={styles.tagHealth}>
                        <Text style={styles.tagHealthText}>🏃 Health</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.intentionName} numberOfLines={2}>
                    {e.title}
                  </Text>
                  {e.subtitle ? (
                    <Text style={styles.intentionSub} numberOfLines={1}>
                      {e.subtitle}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}

            {/* Empty state when no events scheduled */}
            {events.length === 0 && (
              <View
                style={[
                  styles.emptyStateCard,
                  {
                    top: isSelectedToday
                      ? Math.min(Math.max(nowLineY + 24, 200), (LAST_HOUR - START_HOUR - 3) * UNIT)
                      : (10 - START_HOUR) * UNIT,
                  },
                ]}
              >
                <Text style={styles.emptyStateTitle}>Clear day ahead</Text>
                <Text style={styles.emptyStateText}>
                  No scheduled events for this day. Tap ＋ next to any hour to add a task, or sync Google Calendar.
                </Text>
                <TouchableOpacity
                  style={styles.emptyStateBtn}
                  onPress={handleManualSync}
                  disabled={isSyncing}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emptyStateBtnText}>
                    {isSyncing ? 'Syncing...' : 'Sync Google Calendar ↻'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      ) : (
        /* Month View */
        <ScrollView style={styles.monthScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.monthCard}>
            <View style={styles.monthNavRow}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNavBtn}>
                <Text style={styles.monthNavBtnText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthTitle}>{monthTitleStr}</Text>
              <TouchableOpacity onPress={handleNextMonth} style={styles.monthNavBtn}>
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

            {/* Dynamic Calendar Grid */}
            <View style={styles.daysGrid}>
              {monthGridDays.map((item) => {
                if (item.isBlank) {
                  return <View key={item.key} style={styles.dayCellBlank} />;
                }

                const isCellSelected = item.dateStr === selectedDate;
                const isCellToday = item.dateStr === todayStr;
                const hasDot = Boolean(
                  monthOverview?.dots && monthOverview.dots[item.dateStr] && monthOverview.dots[item.dateStr] > 0
                );

                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.dayCell,
                      isCellSelected && styles.dayCellSelected,
                      isCellToday && !isCellSelected && styles.dayCellToday,
                    ]}
                    onPress={() => setSelectedDate(item.dateStr)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dayCellText,
                        (isCellSelected || isCellToday) && styles.dayCellTextHighlight,
                      ]}
                    >
                      {item.dayNum}
                    </Text>
                    {hasDot && (
                      <View
                        style={[
                          styles.cellDot,
                          (isCellSelected || isCellToday) && styles.cellDotHighlight,
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Agenda for Selected Day */}
            <View style={styles.agendaBox}>
              <View style={styles.agendaHeaderRow}>
                <Text style={styles.agendaDate}>
                  {isSelectedToday ? `TODAY · ${displayHeaderDate}` : `AGENDA · ${displayHeaderDate}`}
                </Text>
                <TouchableOpacity onPress={() => setMode('timeline')} style={styles.viewTimelineLink}>
                  <Text style={styles.viewTimelineLinkText}>View timeline →</Text>
                </TouchableOpacity>
              </View>

              {events.length > 0 ? (
                events.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.agendaItem}
                    onPress={() => selectEvent(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.agendaTime}>{item.start}</Text>
                    <View style={styles.agendaInfo}>
                      <Text style={styles.agendaTitle}>{item.title}</Text>
                      {item.subtitle ? <Text style={styles.agendaSub}>{item.subtitle}</Text> : null}
                    </View>
                    {item.source === 'google_calendar' && (
                      <View style={styles.tagGoogleMini}>
                        <Text style={styles.tagGoogleMiniText}>Google</Text>
                      </View>
                    )}
                    {item.source === 'email_meeting' && (
                      <View style={[styles.tagGoogleMini, { backgroundColor: '#fcf1ec', borderColor: '#d4805c' }]}>
                        <Text style={[styles.tagGoogleMiniText, { color: '#b35d38' }]}>✉ Meeting</Text>
                      </View>
                    )}
                    {item.source === 'email_proposal' && (
                      <View style={[styles.tagGoogleMini, { backgroundColor: '#f1eff7', borderColor: '#a69bbe' }]}>
                        <Text style={[styles.tagGoogleMiniText, { color: '#6548a8' }]}>✉ Task</Text>
                      </View>
                    )}
                    {item.source === 'notes_mom' && (
                      <View style={[styles.tagGoogleMini, { backgroundColor: '#eef6f3', borderColor: '#84b8a2' }]}>
                        <Text style={[styles.tagGoogleMiniText, { color: '#27694f' }]}>📝 MoM</Text>
                      </View>
                    )}
                    {item.source === 'notes_action' && (
                      <View style={[styles.tagGoogleMini, { backgroundColor: '#f1eff7', borderColor: '#a69bbe' }]}>
                        <Text style={[styles.tagGoogleMiniText, { color: '#6548a8' }]}>📝 Action</Text>
                      </View>
                    )}
                    {item.source === 'health_event' && (
                      <View style={[styles.tagGoogleMini, { backgroundColor: '#ecf3ee', borderColor: '#89aa94' }]}>
                        <Text style={[styles.tagGoogleMiniText, { color: '#386345' }]}>🏃 Health</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.emptyAgendaText}>No events for this date. Switch to Day view to add.</Text>
              )}
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

            <Text style={styles.fieldLabel}>Optional Notes</Text>
            <TextInput
              style={[styles.input, styles.detailInput]}
              placeholder="Context or notes..."
              value={newDetail}
              onChangeText={setNewDetail}
              multiline
              numberOfLines={2}
              placeholderTextColor="#9ca39c"
            />

            {/* Sync to Google toggle */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setSyncToGoogle(!syncToGoogle)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, syncToGoogle && styles.checkboxActive]}>
                {syncToGoogle && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Also add to Google Calendar</Text>
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeAddTask} disabled={isSaving}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveTask} disabled={isSaving}>
                {isSaving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Task</Text>
                )}
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

            {/* Source Tag */}
            {selectedEvent && (
              <View style={styles.sourceTagPill}>
                <Text style={styles.sourceTagText}>
                  {selectedEvent.source === 'google_calendar'
                    ? '📅 Google Calendar event'
                    : selectedEvent.source === 'email_meeting'
                    ? '✉ Inbound Meeting from Email'
                    : selectedEvent.source === 'email_proposal'
                    ? '✉ Action item from Email'
                    : selectedEvent.source === 'notes_mom'
                    ? '📝 Meeting MoM from Notes'
                    : selectedEvent.source === 'notes_action'
                    ? '📝 Action item from Meeting MoM'
                    : selectedEvent.source === 'health_event'
                    ? '🏃 Sports event from Health module'
                    : '🌿 Rhythm item'}
                </Text>
              </View>
            )}

            {selectedEvent?.subtitle ? (
              <Text style={styles.eventModalDesc}>{selectedEvent.subtitle}</Text>
            ) : null}

            {selectedEvent?.detail ? (
              <Text style={styles.eventDetailText}>{selectedEvent.detail}</Text>
            ) : null}

            <View style={styles.detailActionsRow}>
              {(selectedEvent?.source?.startsWith('email_') || selectedEvent?.source?.startsWith('notes_')) && (
                <TouchableOpacity
                  style={styles.confirmRhythmBtn}
                  onPress={() => selectedEvent && handleConfirmToCalendar(selectedEvent)}
                >
                  <Text style={styles.confirmRhythmBtnText}>Confirm to Day ✓</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteSelected}>
                <Text style={styles.deleteBtnText}>
                  {selectedEvent?.source?.startsWith('email_') || selectedEvent?.source?.startsWith('notes_')
                    ? 'Dismiss'
                    : 'Delete task'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.doneBtn} onPress={() => selectEvent(null)}>
                <Text style={styles.doneBtnText}>Close</Text>
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
  dayStampTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dayStampText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#7d877f',
  },
  jumpTodayBtn: {
    backgroundColor: '#f0ece3',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  jumpTodayText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#6e7a70',
  },
  dayStampSub: {
    fontSize: 10,
    color: '#a6aca4',
    marginTop: 1,
    marginBottom: 6,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  syncHeaderBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: '#f1f2ee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncHeaderBtnDisabled: {
    opacity: 0.5,
  },
  syncHeaderBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#49544b',
  },
  dayToggle: {
    flexDirection: 'row',
    backgroundColor: '#f1f2ee',
    borderRadius: 999,
    padding: 2,
  },
  toggleBtn: {
    paddingVertical: 3,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  toggleBtnActive: {
    backgroundColor: '#27382d',
  },
  toggleText: {
    fontSize: 11,
    color: '#828d84',
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  timelineScroll: {
    flex: 1,
  },
  timelineContent: {
    height: (LAST_HOUR - START_HOUR + 1) * UNIT,
    position: 'relative',
  },
  clockTrack: {
    flex: 1,
    position: 'relative',
  },
  hourRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  hourDigit: {
    width: 76,
    paddingRight: 14,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '400',
    color: '#b6bcb5',
    letterSpacing: -0.5,
  },
  hourDigitNear: {
    color: '#343c36',
    fontWeight: '600',
  },
  hourRule: {
    flex: 1,
    height: 1,
    backgroundColor: '#f1f2ee',
  },
  verticalTrack: {
    position: 'absolute',
    left: 82,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#ebece6',
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
    right: 12,
    maxWidth: 520,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderLeftWidth: 3.5,
    borderWidth: 1,
    borderColor: '#edf0e9',
    paddingVertical: 6,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    justifyContent: 'flex-start',
    zIndex: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  intentionTime: {
    fontSize: 10,
    color: '#b37b63',
    letterSpacing: 0.4,
    fontWeight: '600',
  },
  tagGoogle: {
    backgroundColor: '#eaf1fb',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tagGoogleText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#3367d6',
  },
  tagAction: {
    backgroundColor: '#f1eef8',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tagActionText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#6548a8',
  },
  tagMeeting: {
    backgroundColor: '#fcf1ec',
    borderWidth: 1,
    borderColor: '#d4805c',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tagMeetingText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#b35d38',
  },
  tagMom: {
    backgroundColor: '#eef6f3',
    borderWidth: 1,
    borderColor: '#84b8a2',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tagMomText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#27694f',
  },
  tagNoteAction: {
    backgroundColor: '#f1eef8',
    borderWidth: 1,
    borderColor: '#a69bbe',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tagNoteActionText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#6548a8',
  },
  tagHealth: {
    backgroundColor: '#ecf3ee',
    borderWidth: 1,
    borderColor: '#89aa94',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tagHealthText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#386345',
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
  emptyStateCard: {
    position: 'absolute',
    left: 104,
    right: 18,
    maxWidth: 420,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e8ece5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    zIndex: 4,
  },
  emptyStateTitle: {
    fontFamily: 'serif',
    fontSize: 15,
    fontWeight: '600',
    color: '#2a342d',
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 12,
    color: '#7a857b',
    lineHeight: 18,
    marginBottom: 12,
  },
  emptyStateBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: '#27382d',
    borderRadius: 999,
  },
  emptyStateBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
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
  dayCellBlank: {
    width: '13%',
    height: 40,
  },
  dayCell: {
    width: '13%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: '#27382d',
  },
  dayCellSelected: {
    backgroundColor: '#27382d',
  },
  dayCellText: {
    fontSize: 13,
    color: '#303934',
    fontWeight: '500',
  },
  dayCellTextHighlight: {
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
  cellDotHighlight: {
    backgroundColor: '#ffffff',
  },
  agendaBox: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f2ee',
    paddingTop: 14,
  },
  agendaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  agendaDate: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#9ba39c',
  },
  viewTimelineLink: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  viewTimelineLinkText: {
    fontSize: 11,
    color: '#27382d',
    fontWeight: '600',
  },
  agendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f7f8f6',
    gap: 10,
  },
  agendaTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#b37b63',
    width: 45,
  },
  agendaInfo: {
    flex: 1,
  },
  agendaTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#292e29',
  },
  agendaSub: {
    fontSize: 11,
    color: '#8b948b',
    marginTop: 1,
  },
  emptyAgendaText: {
    fontSize: 12,
    color: '#9aa29a',
    paddingVertical: 12,
    fontStyle: 'italic',
  },
  tagGoogleMini: {
    backgroundColor: '#eaf1fb',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagGoogleMiniText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#3367d6',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 38,
    height: 4,
    backgroundColor: '#d8ded6',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#292e29',
    marginBottom: 16,
    fontFamily: 'Georgia',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#879188',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f8faf7',
    borderWidth: 1,
    borderColor: '#e4e7e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#292e29',
    marginBottom: 12,
  },
  detailInput: {
    height: 60,
    textAlignVertical: 'top',
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
    marginTop: 4,
    marginBottom: 14,
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#a4b0a5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#27382d',
    borderColor: '#27382d',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 12,
    color: '#49524a',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 14,
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
    minWidth: 90,
    alignItems: 'center',
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
  sourceTagPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f3ed',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 10,
  },
  sourceTagText: {
    fontSize: 10,
    color: '#5b695d',
    fontWeight: '600',
  },
  eventModalDesc: {
    fontSize: 14,
    color: '#525a52',
    lineHeight: 20,
    marginBottom: 8,
  },
  eventDetailText: {
    fontSize: 12,
    color: '#747f75',
    lineHeight: 18,
    marginBottom: 18,
    backgroundColor: '#f7f8f5',
    padding: 10,
    borderRadius: 8,
  },
  detailActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  deleteBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#eed6d6',
    backgroundColor: '#fbf5f5',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 999,
  },
  deleteBtnText: {
    color: '#9e3b3b',
    fontWeight: '600',
    fontSize: 13,
  },
  confirmRhythmBtn: {
    flex: 1.2,
    backgroundColor: '#27382d',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 999,
  },
  confirmRhythmBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  crossModuleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 6,
    backgroundColor: '#f7f8f4',
    borderBottomWidth: 1,
    borderBottomColor: '#ebece4',
    gap: 8,
  },
  crossModuleKicker: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#8b948a',
  },
  crossModulePills: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  moduleSignalPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  moduleSignalText: {
    fontSize: 10,
    fontWeight: '700',
  },
  doneBtn: {
    flex: 1,
    backgroundColor: '#27382d',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 999,
  },
  doneBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
  },
});
