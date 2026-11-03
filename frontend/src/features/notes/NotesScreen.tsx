import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useNotesStore } from './notes.store';
import { AppHeader } from '../navigation/AppHeader';
import { PillTabs } from '../../shared/components/PillTabs';
import { NoteItem, NotesCategory } from './notes.types';
import { colors, radii, spacing, typography } from '../../shared/theme/tokens';
import { useToast } from '../../shared/components/Toast';
import { audioRecorder } from './utils/audioRecorder';

const NOTE_TABS: { id: NotesCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'Work', label: 'Work' },
  { id: 'Prayan', label: 'Prayan' },
  { id: 'Health', label: 'Health' },
  { id: 'Travel', label: 'Travel' },
];

export const NotesScreen: React.FC = () => {
  const {
    currentCategory,
    setCategory,
    notes,
    selectedNote,
    selectNote,
    addNote,
    deleteNote,
    recordVoiceMeeting,
    syncTasksToCalendar,
    fetchNotes,
    isLoading,
  } = useNotesStore();
  const { showToast } = useToast();

  // Search
  const [search, setSearch] = useState('');

  // Quick Capture Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [noteArea, setNoteArea] = useState<NoteItem['area']>('Work');

  // Voice Meeting Modal
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingArea, setMeetingArea] = useState<NoteItem['area']>('Work');
  const [recordingLang, setRecordingLang] = useState<'mr-IN' | 'en-IN' | 'hi-IN'>('mr-IN');
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [micActive, setMicActive] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  // Filter notes based on category and search query
  const filteredNotes = notes.filter((n) => {
    const matchesCategory = currentCategory === 'all' || n.area === currentCategory;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      n.title.toLowerCase().includes(q) ||
      n.body.toLowerCase().includes(q) ||
      (n.mom_data?.summary && n.mom_data.summary.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  const handleSaveNote = async () => {
    if (!noteTitle.trim()) {
      showToast('Please enter a note title', 'warning');
      return;
    }
    await addNote(noteTitle, noteBody, noteArea);
    setNoteTitle('');
    setNoteBody('');
    setIsAddOpen(false);
    showToast('Note captured to permanent memory', 'success');
  };

  const handleDeleteNote = async (id: string) => {
    await deleteNote(id);
    showToast('Note deleted', 'info');
  };

  const startVoiceRecording = async () => {
    setIsVoiceOpen(true);
    setIsRecording(true);
    setRecordSeconds(0);
    setIsAnalyzing(false);
    setMicActive(false);

    // Cross-platform start: Works on Web (MediaRecorder + SpeechRecognition) & Mobile
    const success = await audioRecorder.start(recordingLang);
    setMicActive(success);

    timerRef.current = setInterval(() => {
      setRecordSeconds((sec) => sec + 1);
    }, 1000);
  };

  const stopAndProcessVoice = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    setIsAnalyzing(true);

    const secondsRecorded = recordSeconds || 5;

    try {
      // Returns real base64 + live spoken transcript
      const { audioBase64, rawTranscript, mimeType } = await audioRecorder.stop();

      const generatedNote = await recordVoiceMeeting(
        meetingTitle.trim() || `🎙️ ${meetingArea} Discussion & Strategy Sync`,
        meetingArea,
        secondsRecorded,
        audioBase64,
        mimeType,
        rawTranscript
      );

      setIsVoiceOpen(false);
      setIsAnalyzing(false);
      setMeetingTitle('');
      showToast('Meeting MoM & Tasks generated with AI!', 'success');
      selectNote(generatedNote);
    } catch (e) {
      setIsVoiceOpen(false);
      setIsAnalyzing(false);
      showToast('Error processing meeting audio', 'error');
    }
  };

  const cancelVoiceRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    audioRecorder.cancel();
    setIsRecording(false);
    setIsVoiceOpen(false);
    setIsAnalyzing(false);
    setRecordSeconds(0);
    setMicActive(false);
  };

  const handleSyncTasks = async (noteId: string) => {
    const msg = await syncTasksToCalendar(noteId);
    showToast(msg, 'success');
  };

  const formatTimer = (sec: number) => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <View style={styles.container}>
      <AppHeader
        kicker="LOCAL MEMORY ARCHIVE"
        title="Notes & captures."
        subtitle="Uncluttered thoughts, live voice meeting intelligence and smart cross-space links."
      />

      {/* Top Action Bar */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.voiceRecordBtn}
          onPress={startVoiceRecording}
          activeOpacity={0.8}
        >
          <Text style={styles.voiceRecordIcon}>🎙️</Text>
          <Text style={styles.voiceRecordBtnText}>Record Meeting (MoM)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.captureBtn}
          onPress={() => setIsAddOpen(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.captureBtnText}>+ Capture</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search thoughts, meetings, decisions..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={colors.muted}
        />
      </View>

      {/* Category Tabs */}
      <View style={styles.tabsRow}>
        <PillTabs
          tabs={NOTE_TABS}
          activeTab={currentCategory}
          onSelect={(t) => setCategory(t as NotesCategory)}
        />
      </View>

      {/* Notes List */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && notes.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={styles.loadingText}>Loading notes...</Text>
          </View>
        ) : filteredNotes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyTitle}>No notes found</Text>
            <Text style={styles.emptySubtitle}>
              Click '+ Capture' or '🎙️ Record Meeting' to create your first real note!
            </Text>
          </View>
        ) : (
          <View style={styles.notesGrid}>
            {filteredNotes.map((n) => {
              const isVoice = n.source_type === 'voice_meeting' || !!n.mom_data;
              return (
                <TouchableOpacity
                  key={n.id}
                  style={[styles.noteCard, isVoice && styles.voiceNoteCard]}
                  onPress={() => selectNote(n)}
                  activeOpacity={0.7}
                >
                  <View style={styles.noteMeta}>
                    <Text style={[styles.noteDate, isVoice && styles.voiceDate]}>
                      {n.date} · {n.source}
                    </Text>
                    <View
                      style={[
                        styles.areaBadge,
                        n.area === 'Work' && styles.areaBadgeWork,
                        n.area === 'Prayan' && styles.areaBadgePrayan,
                      ]}
                    >
                      <Text style={styles.areaText}>{n.area}</Text>
                    </View>
                  </View>
                  <Text style={styles.noteTitle}>{n.title}</Text>
                  <Text style={styles.noteBody} numberOfLines={3}>
                    {n.mom_data?.summary || n.body}
                  </Text>

                  {isVoice && n.mom_data && (
                    <View style={styles.momBadgeRow}>
                      <Text style={styles.momBadgeText}>
                        ✦ MoM Available ({n.mom_data.actions?.length || 0} Action Items)
                      </Text>
                      <Text style={styles.momOpenText}>Open Details ➔</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Smart Cross-Space Links Section */}
        <View style={styles.cardWarm}>
          <Text style={styles.cardKicker}>CROSS-SPACE CONTEXT LINKS</Text>
          <View style={styles.linkLine}>
            <Text style={styles.linkSource}>Voice Meeting MoM</Text>
            <Text style={styles.linkTarget}>➔ Work · Manjalpur</Text>
          </View>
          <View style={styles.linkLine}>
            <Text style={styles.linkSource}>Family learning idea</Text>
            <Text style={styles.linkTarget}>➔ Prayan · speedcubing</Text>
          </View>
          <View style={styles.linkLine}>
            <Text style={styles.linkSource}>Recovery note</Text>
            <Text style={styles.linkTarget}>➔ Health · 42k training</Text>
          </View>
        </View>
      </ScrollView>

      {/* 1. Quick Capture Modal */}
      <Modal visible={isAddOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Capture Thought</Text>
            <Text style={styles.fieldLabel}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Conversation with architect..."
              value={noteTitle}
              onChangeText={setNoteTitle}
              placeholderTextColor={colors.muted}
            />

            <Text style={styles.fieldLabel}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Context, ideas, details..."
              value={noteBody}
              onChangeText={setNoteBody}
              multiline
              numberOfLines={4}
              placeholderTextColor={colors.muted}
            />

            <Text style={styles.fieldLabel}>Linked Space</Text>
            <View style={styles.areaRow}>
              {(['Work', 'Prayan', 'Health', 'Travel'] as const).map((a) => (
                <TouchableOpacity
                  key={a}
                  style={[styles.areaPill, noteArea === a && styles.areaPillActive]}
                  onPress={() => setNoteArea(a)}
                >
                  <Text
                    style={[
                      styles.areaPillText,
                      noteArea === a && styles.areaPillTextActive,
                    ]}
                  >
                    {a}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsAddOpen(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveNote}>
                <Text style={styles.saveBtnText}>Save Note</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 2. Voice Meeting Recording Modal */}
      <Modal visible={isVoiceOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {isAnalyzing ? (
              <View style={styles.analyzingBox}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={styles.analyzingTitle}>AI is analyzing your voice conversation...</Text>
                <Text style={styles.analyzingSubtitle}>
                  Processing speech, extracting executive summary, key decisions, and action items...
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.recHeaderRow}>
                  <View style={styles.recStatusPill}>
                    <View style={styles.recDot} />
                    <Text style={styles.recStatusText}>LIVE RECORDING</Text>
                  </View>
                  <Text style={[styles.recAudioInfo, micActive && styles.micActiveText]}>
                    {micActive ? '🎙️ Mic Active' : 'Audio Ready'}
                  </Text>
                </View>

                <View style={styles.timerContainer}>
                  <Text style={styles.timerText}>{formatTimer(recordSeconds)}</Text>
                  <Text style={styles.timerSub}>
                    {micActive
                      ? 'Speak into microphone in Marathi, English, or Hindi...'
                      : 'Listening to conversation...'}
                  </Text>
                </View>

                {/* Spoken Language Selector */}
                <Text style={styles.fieldLabel}>Spoken Language (बोलण्याची भाषा)</Text>
                <View style={styles.areaRow}>
                  {[
                    { id: 'mr-IN', label: 'मराठी (Marathi)' },
                    { id: 'en-IN', label: 'English' },
                    { id: 'hi-IN', label: 'हिंदी (Hindi)' },
                  ].map((l) => (
                    <TouchableOpacity
                      key={l.id}
                      style={[
                        styles.areaPill,
                        recordingLang === l.id && styles.areaPillActive,
                      ]}
                      onPress={() => setRecordingLang(l.id as any)}
                    >
                      <Text
                        style={[
                          styles.areaPillText,
                          recordingLang === l.id && styles.areaPillTextActive,
                        ]}
                      >
                        {l.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Meeting Title (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Council & Operations Sync"
                  value={meetingTitle}
                  onChangeText={setMeetingTitle}
                  placeholderTextColor={colors.muted}
                />

                <Text style={styles.fieldLabel}>Assigned Space</Text>
                <View style={styles.areaRow}>
                  {(['Work', 'Prayan', 'Health', 'Travel'] as const).map((a) => (
                    <TouchableOpacity
                      key={a}
                      style={[
                        styles.areaPill,
                        meetingArea === a && styles.areaPillActive,
                      ]}
                      onPress={() => setMeetingArea(a)}
                    >
                      <Text
                        style={[
                          styles.areaPillText,
                          meetingArea === a && styles.areaPillTextActive,
                        ]}
                      >
                        {a}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={cancelVoiceRecording}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.stopRecBtn}
                    onPress={stopAndProcessVoice}
                  >
                    <Text style={styles.stopRecBtnText}>⏹ Stop & Generate MoM</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* 3. Note Detail & MoM View Modal */}
      <Modal visible={!!selectedNote} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, styles.detailSheet]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.noteMeta}>
                <Text style={styles.noteDate}>
                  {selectedNote?.date} · {selectedNote?.source}
                </Text>
                <View style={styles.areaBadge}>
                  <Text style={styles.areaText}>{selectedNote?.area}</Text>
                </View>
              </View>

              <Text style={styles.detailTitle}>{selectedNote?.title}</Text>
              <Text style={styles.noteDetailBody}>{selectedNote?.body}</Text>

              {/* If Transcript exists */}
              {selectedNote?.transcript ? (
                <View style={styles.transcriptBox}>
                  <Text style={styles.transcriptKicker}>🎙️ AUDIO TRANSCRIPT (बोललेले शब्द)</Text>
                  <Text style={styles.transcriptText}>{selectedNote.transcript}</Text>
                </View>
              ) : null}

              {/* If Voice MoM data exists */}
              {selectedNote?.mom_data && (
                <View style={styles.momDetailContainer}>
                  {/* Summary */}
                  <View style={styles.momBoxSummary}>
                    <Text style={styles.momBoxKicker}>📌 EXECUTIVE SUMMARY</Text>
                    <Text style={styles.momBoxText}>
                      {selectedNote.mom_data.summary}
                    </Text>
                  </View>

                  {/* Decisions */}
                  {selectedNote.mom_data.decisions?.length > 0 && (
                    <View style={styles.momBoxDecisions}>
                      <Text style={styles.momBoxKickerSage}>
                        🤝 KEY DECISIONS TAKEN
                      </Text>
                      {selectedNote.mom_data.decisions.map((d, i) => (
                        <Text key={i} style={styles.decisionItem}>
                          • {d}
                        </Text>
                      ))}
                    </View>
                  )}

                  {/* Action Items */}
                  {selectedNote.mom_data.actions?.length > 0 && (
                    <View style={styles.momBoxActions}>
                      <View style={styles.actionHeaderRow}>
                        <Text style={styles.momBoxKickerWarm}>
                          ✅ ACTION ITEMS (MOM)
                        </Text>
                        <TouchableOpacity
                          style={styles.syncBtn}
                          onPress={() => handleSyncTasks(selectedNote.id)}
                        >
                          <Text style={styles.syncBtnText}>
                            + Sync Tasks to Calendar
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {selectedNote.mom_data.actions.map((act, i) => (
                        <View key={i} style={styles.actionItemRow}>
                          <Text style={styles.actionTaskText}>• {act.task}</Text>
                          <View style={styles.assigneeBadge}>
                            <Text style={styles.assigneeText}>
                              {act.assignee} · {act.due}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.detailActionsRow}>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => {
                    if (selectedNote) handleDeleteNote(selectedNote.id);
                  }}
                >
                  <Text style={styles.deleteBtnText}>🗑️ Delete Note</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.doneBtn}
                  onPress={() => selectNote(null)}
                >
                  <Text style={styles.doneBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  voiceRecordBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
  },
  voiceRecordIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  voiceRecordBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
  },
  captureBtn: {
    backgroundColor: colors.ink,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.pill,
  },
  captureBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: 12,
    color: colors.ink,
  },
  tabsRow: {
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
  loadingContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.muted,
  },
  emptyContainer: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
    textAlign: 'center',
  },
  notesGrid: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  noteCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  voiceNoteCard: {
    borderColor: colors.accent,
    backgroundColor: '#fffdfa',
  },
  noteMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  noteDate: {
    fontSize: 11,
    color: colors.inkMuted,
  },
  voiceDate: {
    color: colors.accentDark,
    fontWeight: '600',
  },
  areaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.iconBg,
  },
  areaBadgeWork: {
    backgroundColor: colors.sageWash,
  },
  areaBadgePrayan: {
    backgroundColor: colors.accentWash,
  },
  areaText: {
    fontSize: 10,
    color: colors.inkSecondary,
    fontFamily: typography.fontFamily.uiMedium,
  },
  noteTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
    marginBottom: 4,
  },
  noteBody: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.inkSecondary,
  },
  momBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  momBadgeText: {
    fontSize: 11,
    color: colors.accentDark,
    fontFamily: typography.fontFamily.uiMedium,
  },
  momOpenText: {
    fontSize: 11,
    color: colors.accent,
    fontFamily: typography.fontFamily.uiMedium,
  },
  cardWarm: {
    backgroundColor: colors.surfaceWarm,
    padding: spacing.md,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.borderDark,
    marginTop: spacing.sm,
  },
  cardKicker: {
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.accentDark,
    fontFamily: typography.fontFamily.uiMedium,
    marginBottom: spacing.xs,
  },
  linkLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  linkSource: {
    fontSize: 12,
    color: colors.inkSecondary,
  },
  linkTarget: {
    fontSize: 12,
    color: colors.ink,
    fontFamily: typography.fontFamily.uiMedium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlayBg,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  detailSheet: {
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: 11,
    color: colors.inkMuted,
    fontFamily: typography.fontFamily.uiMedium,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radii.input,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 13,
    color: colors.ink,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  areaRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  areaPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.tabBorder,
  },
  areaPillActive: {
    backgroundColor: colors.tabSelectedBg,
    borderColor: colors.tabSelectedBg,
  },
  areaPillText: {
    fontSize: 12,
    color: colors.inkSecondary,
  },
  areaPillTextActive: {
    color: '#ffffff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderDark,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 12,
    color: colors.inkSecondary,
    fontFamily: typography.fontFamily.uiMedium,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.ink,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 12,
    color: '#ffffff',
    fontFamily: typography.fontFamily.uiMedium,
  },
  recHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  recStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#dc2626',
  },
  recStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#dc2626',
    letterSpacing: 0.5,
  },
  recAudioInfo: {
    fontSize: 11,
    color: colors.muted,
  },
  micActiveText: {
    color: '#16a34a',
    fontWeight: '600',
  },
  timerContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.noticeBg,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
  },
  timerText: {
    fontSize: 32,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
    letterSpacing: 1,
  },
  timerSub: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  stopRecBtn: {
    flex: 2,
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    alignItems: 'center',
  },
  stopRecBtnText: {
    fontSize: 12,
    color: '#ffffff',
    fontFamily: typography.fontFamily.uiMedium,
  },
  analyzingBox: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  analyzingTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
    marginTop: spacing.md,
  },
  analyzingSubtitle: {
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: spacing.md,
  },
  detailTitle: {
    fontSize: 16,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  noteDetailBody: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkSecondary,
    marginBottom: spacing.sm,
  },
  transcriptBox: {
    backgroundColor: '#f6f7f3',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.sm,
  },
  transcriptKicker: {
    fontSize: 10,
    letterSpacing: 1,
    color: colors.inkSecondary,
    fontFamily: typography.fontFamily.uiMedium,
    marginBottom: 4,
  },
  transcriptText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.ink,
    fontStyle: 'italic',
  },
  momDetailContainer: {
    gap: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  momBoxSummary: {
    backgroundColor: colors.surfaceWarm,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  momBoxKicker: {
    fontSize: 10,
    letterSpacing: 1,
    color: colors.accentDark,
    fontFamily: typography.fontFamily.uiMedium,
    marginBottom: 4,
  },
  momBoxText: {
    fontSize: 12,
    color: colors.ink,
    lineHeight: 17,
  },
  momBoxDecisions: {
    backgroundColor: colors.sageWash,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  momBoxKickerSage: {
    fontSize: 10,
    letterSpacing: 1,
    color: colors.tabSelectedBg,
    fontFamily: typography.fontFamily.uiMedium,
    marginBottom: 4,
  },
  decisionItem: {
    fontSize: 12,
    color: colors.ink,
    lineHeight: 18,
  },
  momBoxActions: {
    backgroundColor: '#fffdfa',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  actionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  momBoxKickerWarm: {
    fontSize: 10,
    letterSpacing: 1,
    color: colors.accentDark,
    fontFamily: typography.fontFamily.uiMedium,
  },
  syncBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  syncBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
  },
  actionItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  actionTaskText: {
    fontSize: 12,
    color: colors.ink,
    flex: 1,
  },
  assigneeBadge: {
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
    marginLeft: 6,
  },
  assigneeText: {
    fontSize: 10,
    color: colors.accentDark,
    fontFamily: typography.fontFamily.uiMedium,
  },
  detailActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  deleteBtn: {
    paddingVertical: 6,
  },
  deleteBtnText: {
    color: '#dc2626',
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
  },
  doneBtn: {
    backgroundColor: colors.ink,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
  },
});
