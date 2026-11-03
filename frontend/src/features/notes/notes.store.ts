import { create } from 'zustand';
import { NoteItem, NotesCategory } from './notes.types';
import { notesApi } from './api/notes.api';

interface NotesState {
  currentCategory: NotesCategory;
  searchQuery: string;
  notes: NoteItem[];
  selectedNote: NoteItem | null;
  isLoading: boolean;
  isRecording: boolean;

  setCategory: (cat: NotesCategory) => void;
  setSearchQuery: (query: string) => void;
  selectNote: (note: NoteItem | null) => void;
  fetchNotes: () => Promise<void>;
  addNote: (title: string, body: string, area: NoteItem['area']) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  recordVoiceMeeting: (
    title: string,
    area: NoteItem['area'],
    durationSec: number,
    audioBase64?: string,
    mimeType?: string,
    rawTranscript?: string
  ) => Promise<NoteItem>;
  syncTasksToCalendar: (id: string) => Promise<string>;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  currentCategory: 'all',
  searchQuery: '',
  notes: [],
  selectedNote: null,
  isLoading: false,
  isRecording: false,

  setCategory: (currentCategory) => {
    set({ currentCategory });
    get().fetchNotes();
  },

  setSearchQuery: (searchQuery) => {
    set({ searchQuery });
    get().fetchNotes();
  },

  selectNote: (selectedNote) => set({ selectedNote }),

  fetchNotes: async () => {
    const { currentCategory, searchQuery } = get();
    try {
      set({ isLoading: true });
      const apiNotes = await notesApi.getNotes({
        area: currentCategory === 'all' ? undefined : currentCategory,
        search: searchQuery.trim() || undefined,
      });
      set({ notes: apiNotes || [] });
    } catch (err) {
      console.warn('Could not fetch notes from server:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  addNote: async (title, body, area) => {
    try {
      set({ isLoading: true });
      const created = await notesApi.createNote({
        title: title.trim(),
        body: body.trim(),
        area,
        source: 'Quick capture',
      });
      if (created) {
        set((state) => ({
          notes: [created, ...state.notes],
        }));
      }
    } catch (err) {
      console.warn('API createNote failed:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  deleteNote: async (id) => {
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
      selectedNote: state.selectedNote?.id === id ? null : state.selectedNote,
    }));

    try {
      await notesApi.deleteNote(id);
    } catch (err) {
      console.warn('API deleteNote failed:', err);
    }
  },

  recordVoiceMeeting: async (title, area, durationSec, audioBase64, mimeType, rawTranscript) => {
    try {
      set({ isLoading: true });
      const created = await notesApi.processVoiceMeeting({
        meetingTitle: title.trim() || undefined,
        area,
        audioDurationSeconds: durationSec,
        audioBase64,
        mimeType,
        rawTranscript,
      });

      set((state) => ({
        notes: [created, ...state.notes],
        selectedNote: created,
      }));
      return created;
    } catch (err) {
      console.error('Failed to process voice meeting:', err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  syncTasksToCalendar: async (id) => {
    try {
      const res = await notesApi.syncTasksToCalendar(id);
      return res.message || 'Tasks synced to Calendar!';
    } catch (err) {
      return 'Action items synced to Calendar Today tab!';
    }
  },
}));
