import fs from 'fs';
import path from 'path';
import { supabase } from '../../config/supabase.js';
import { env } from '../../config/env.js';
import { CreateNoteInput, UpdateNoteInput } from './notes.dto.js';

export interface NoteRecord {
  id: string;
  user_id: string;
  title: string;
  body: string;
  area: 'Work' | 'Prayan' | 'Health' | 'Travel' | 'Unsorted';
  source: string;
  source_type: 'text' | 'voice_meeting';
  transcript?: string;
  mom_data?: {
    summary: string;
    decisions: string[];
    actions: { task: string; assignee: string; due: string }[];
  };
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

// Consistent data directory location inside backend/data
const ROOT_DIR = fs.existsSync(path.resolve(process.cwd(), 'backend'))
  ? path.resolve(process.cwd(), 'backend')
  : process.cwd();
const DATA_DIR = path.resolve(ROOT_DIR, 'data');
const DATA_FILE = path.join(DATA_DIR, 'notes.json');

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Load notes from persistent JSON file
function loadPersistentNotes(): NoteRecord[] {
  ensureDataDir();
  if (fs.existsSync(DATA_FILE)) {
    try {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      console.warn('Could not parse notes.json, initializing empty:', e);
    }
  }
  return [];
}

// Save notes to persistent JSON file
function savePersistentNotes(notes: NoteRecord[]) {
  ensureDataDir();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(notes, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write to notes.json:', e);
  }
}

let fileNotes: NoteRecord[] = loadPersistentNotes();

const isSupabaseConfigured = () =>
  env.SUPABASE_URL &&
  !env.SUPABASE_URL.includes('placeholder') &&
  env.SUPABASE_SERVICE_ROLE_KEY &&
  !env.SUPABASE_SERVICE_ROLE_KEY.includes('placeholder');

export const notesRepository = {
  async getNotes(filters?: { area?: string; search?: string }) {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase
          .from('notes')
          .select('*')
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false });

        if (filters?.area && filters.area !== 'all') {
          query = query.eq('area', filters.area);
        }
        if (filters?.search) {
          query = query.ilike('title', `%${filters.search}%`);
        }

        const { data, error } = await query;
        if (!error && data) return data as NoteRecord[];
      } catch (err) {
        console.warn('Supabase notes query failed, using persistent file fallback:', err);
      }
    }

    fileNotes = loadPersistentNotes();

    let result = [...fileNotes];
    if (filters?.area && filters.area !== 'all') {
      result = result.filter((n) => n.area === filters.area);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.body.toLowerCase().includes(q) ||
          (n.mom_data?.summary && n.mom_data.summary.toLowerCase().includes(q))
      );
    }
    return result;
  },

  async getNoteById(id: string) {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('notes').select('*').eq('id', id).single();
        if (!error && data) return data as NoteRecord;
      } catch (err) {
        console.warn('Supabase getNoteById failed, using persistent file store:', err);
      }
    }

    fileNotes = loadPersistentNotes();
    return fileNotes.find((n) => n.id === id) || null;
  },

  async createNote(input: CreateNoteInput, userId = '00000000-0000-0000-0000-000000000000') {
    const newNote: NoteRecord = {
      id: `n-${Date.now()}`,
      user_id: userId,
      title: input.title,
      body: input.body,
      area: input.area,
      source: input.source,
      source_type: input.source_type,
      transcript: input.transcript,
      mom_data: input.mom_data,
      is_pinned: input.is_pinned,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('notes').insert(newNote).select().single();
        if (!error && data) return data as NoteRecord;
      } catch (err) {
        console.warn('Supabase createNote failed, writing to persistent file:', err);
      }
    }

    fileNotes = loadPersistentNotes();
    fileNotes.unshift(newNote);
    savePersistentNotes(fileNotes);
    return newNote;
  },

  async updateNote(id: string, input: UpdateNoteInput) {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('notes')
          .update({ ...input, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data as NoteRecord;
      } catch (err) {
        console.warn('Supabase updateNote failed, updating persistent file:', err);
      }
    }

    fileNotes = loadPersistentNotes();
    const idx = fileNotes.findIndex((n) => n.id === id);
    if (idx !== -1) {
      fileNotes[idx] = {
        ...fileNotes[idx],
        ...input,
        updated_at: new Date().toISOString(),
      };
      savePersistentNotes(fileNotes);
      return fileNotes[idx];
    }
    return null;
  },

  async deleteNote(id: string) {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('notes').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteNote failed, deleting from persistent file:', err);
      }
    }

    fileNotes = loadPersistentNotes();
    const initialLen = fileNotes.length;
    fileNotes = fileNotes.filter((n) => n.id !== id);
    savePersistentNotes(fileNotes);
    return fileNotes.length < initialLen;
  },
};
