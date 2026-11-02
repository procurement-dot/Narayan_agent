import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { useNotesStore } from './notes.store';
import { AppHeader } from '../navigation/AppHeader';
import { PillTabs } from '../../shared/components/PillTabs';
import { NoteItem, NotesCategory } from './notes.types';
import { colors, radii, spacing, typography } from '../../shared/theme/tokens';
import { useToast } from '../../shared/components/Toast';

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
  } = useNotesStore();
  const { showToast } = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [noteArea, setNoteArea] = useState<NoteItem['area']>('Work');

  const filteredNotes = notes.filter(
    (n) => currentCategory === 'all' || n.area === currentCategory
  );

  const handleSaveNote = () => {
    if (!noteTitle.trim()) {
      showToast('Please enter a note title', 'warning');
      return;
    }
    addNote(noteTitle, noteBody, noteArea);
    setNoteTitle('');
    setNoteBody('');
    setIsAddOpen(false);
    showToast('Note captured to local memory', 'success');
  };

  return (
    <View style={styles.container}>
      <AppHeader
        kicker="LOCAL MEMORY ARCHIVE"
        title="Notes & captures."
        subtitle="Uncluttered thoughts, meeting notes and smart cross-space links."
      />

      <View style={styles.topRow}>
        <View style={styles.tabsContainer}>
          <PillTabs
            tabs={NOTE_TABS}
            activeTab={currentCategory}
            onSelect={(t) => setCategory(t as NotesCategory)}
          />
        </View>

        <TouchableOpacity
          style={styles.captureBtn}
          onPress={() => setIsAddOpen(true)}
        >
          <Text style={styles.captureBtnText}>+ Capture</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.notesGrid}>
          {filteredNotes.map((n) => (
            <TouchableOpacity
              key={n.id}
              style={styles.noteCard}
              onPress={() => selectNote(n)}
              activeOpacity={0.7}
            >
              <View style={styles.noteMeta}>
                <Text style={styles.noteDate}>{n.date}</Text>
                <View style={styles.areaBadge}>
                  <Text style={styles.areaText}>{n.area}</Text>
                </View>
              </View>
              <Text style={styles.noteTitle}>{n.title}</Text>
              <Text style={styles.noteBody} numberOfLines={3}>
                {n.body}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Smart Links Section */}
        <View style={styles.cardWarm}>
          <Text style={styles.cardKicker}>CROSS-SPACE CONTEXT LINKS</Text>
          <View style={styles.linkLine}>
            <Text style={styles.linkSource}>Meeting note</Text>
            <Text style={styles.linkTarget}>➔ Work · Manjalpur</Text>
          </View>
          <View style={styles.linkLine}>
            <Text style={styles.linkSource}>Family learning idea</Text>
            <Text style={styles.linkTarget}>➔ Prayan · projects</Text>
          </View>
          <View style={styles.linkLine}>
            <Text style={styles.linkSource}>Recovery note</Text>
            <Text style={styles.linkTarget}>➔ Health · training</Text>
          </View>
        </View>
      </ScrollView>

      {/* Add Note Modal */}
      <Modal visible={isAddOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Capture Thought</Text>
            <Text style={styles.fieldLabel}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Conversation with partner..."
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
                  style={[
                    styles.areaPill,
                    noteArea === a && styles.areaPillActive,
                  ]}
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
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveNote}
              >
                <Text style={styles.saveBtnText}>Save Note</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Note Detail Modal */}
      <Modal visible={!!selectedNote} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.noteMeta}>
              <Text style={styles.noteDate}>{selectedNote?.date}</Text>
              <View style={styles.areaBadge}>
                <Text style={styles.areaText}>{selectedNote?.area}</Text>
              </View>
            </View>
            <Text style={styles.modalTitle}>{selectedNote?.title}</Text>
            <Text style={styles.noteDetailBody}>{selectedNote?.body}</Text>
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => selectNote(null)}
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  tabsContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  captureBtn: {
    backgroundColor: colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  captureBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  notesGrid: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  noteCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  noteMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  noteDate: {
    fontSize: 11,
    color: colors.muted,
  },
  areaBadge: {
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  areaText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  noteTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
    marginBottom: 4,
  },
  noteBody: {
    fontSize: 12,
    color: colors.inkSecondary,
    lineHeight: 17,
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
    marginBottom: 8,
  },
  linkLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  linkSource: {
    fontSize: 12,
    color: colors.ink,
  },
  linkTarget: {
    fontSize: 12,
    color: colors.accent,
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
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.muted,
    marginBottom: 4,
    marginTop: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.ink,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  areaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 6,
    marginBottom: spacing.md,
  },
  areaPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceWarm,
  },
  areaPillActive: {
    backgroundColor: colors.ink,
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
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    color: colors.inkSecondary,
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: colors.ink,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radii.pill,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
  },
  noteDetailBody: {
    fontSize: 14,
    color: colors.inkSecondary,
    lineHeight: 21,
    marginVertical: spacing.md,
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
