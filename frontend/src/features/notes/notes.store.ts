import { create } from 'zustand';
import { NoteItem, NotesCategory } from './notes.types';
import { INITIAL_NOTES } from './notes.mock';

interface NotesState {
  currentCategory: NotesCategory;
  notes: NoteItem[];
  selectedNote: NoteItem | null;
  setCategory: (cat: NotesCategory) => void;
  selectNote: (note: NoteItem | null) => void;
  addNote: (title: string, body: string, area: NoteItem['area']) => void;
}

export const useNotesStore = create<NotesState>((set) => ({
  currentCategory: 'all',
  notes: INITIAL_NOTES,
  selectedNote: null,

  setCategory: (currentCategory) => set({ currentCategory }),
  selectNote: (selectedNote) => set({ selectedNote }),
  addNote: (title, body, area) =>
    set((state) => ({
      notes: [
        {
          id: `note-${Date.now()}`,
          title: title.trim(),
          body: body.trim(),
          area,
          date: 'Today',
          source: 'Quick capture',
        },
        ...state.notes,
      ],
    })),
}));
