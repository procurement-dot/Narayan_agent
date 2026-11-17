import fs from 'fs';
import path from 'path';
import { db } from '../../db/db.js';
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

export const notesRepository = {
  async getNotes(filters?: { area?: string; search?: string }) {
    try {
      let sql = 'SELECT * FROM notes WHERE 1=1';
      const params: any[] = [];
      if (filters?.area && filters.area !== 'all') {
        params.push(filters.area);
        sql += ` AND area = $${params.length}`;
      }
      if (filters?.search) {
        params.push(`%${filters.search}%`);
        sql += ` AND (title ILIKE $${params.length} OR body ILIKE $${params.length})`;
      }
      sql += ' ORDER BY is_pinned DESC, created_at DESC';
      const rows = await db.query(sql, params);
      if (rows && rows.length > 0) return rows as NoteRecord[];
    } catch (err) {
      console.warn('DB notes query failed, using persistent file fallback:', err);
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
    try {
      const row = await db.queryOne('SELECT * FROM notes WHERE id = $1', [id]);
      if (row) return row as NoteRecord;
    } catch (err) {
      console.warn('DB getNoteById failed, using persistent file store:', err);
    }

    fileNotes = loadPersistentNotes();
    return fileNotes.find((n) => n.id === id) || null;
  },

  async createNote(input: CreateNoteInput, userId = '00000000-0000-0000-0000-000000000001') {
    const newNote: NoteRecord = {
      id: `n-${Date.now()}`,
      user_id: userId,
      title: input.title,
      body: input.body || '',
      area: input.area,
      source: input.source || 'Quick capture',
      source_type: input.source_type || 'text',
      transcript: input.transcript,
      mom_data: input.mom_data,
      is_pinned: Boolean(input.is_pinned),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const row = await db.queryOne(
        `INSERT INTO notes (user_id, title, body, area, source, source_type, transcript, mom_data, is_pinned)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          userId,
          input.title,
          input.body || '',
          input.area,
          input.source || 'Quick capture',
          input.source_type || 'text',
          input.transcript || null,
          input.mom_data ? JSON.stringify(input.mom_data) : null,
          Boolean(input.is_pinned),
        ]
      );
      if (row) return row as NoteRecord;
    } catch (err) {
      console.warn('DB createNote failed, writing to persistent file:', err);
    }

    fileNotes = loadPersistentNotes();
    fileNotes.unshift(newNote);
    savePersistentNotes(fileNotes);
    return newNote;
  },

  async updateNote(id: string, input: UpdateNoteInput) {
    try {
      const sets: string[] = ['updated_at = NOW()'];
      const params: any[] = [id];
      if (input.title !== undefined) {
        params.push(input.title);
        sets.push(`title = $${params.length}`);
      }
      if (input.body !== undefined) {
        params.push(input.body);
        sets.push(`body = $${params.length}`);
      }
      if (input.area !== undefined) {
        params.push(input.area);
        sets.push(`area = $${params.length}`);
      }
      if (input.is_pinned !== undefined) {
        params.push(input.is_pinned);
        sets.push(`is_pinned = $${params.length}`);
      }
      const row = await db.queryOne(
        `UPDATE notes SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
        params
      );
      if (row) return row as NoteRecord;
    } catch (err) {
      console.warn('DB updateNote failed, updating persistent file:', err);
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
    try {
      await db.query('DELETE FROM notes WHERE id = $1', [id]);
    } catch (err) {
      console.warn('DB deleteNote failed, deleting from persistent file:', err);
    }

    fileNotes = loadPersistentNotes();
    const initialLen = fileNotes.length;
    fileNotes = fileNotes.filter((n) => n.id !== id);
    savePersistentNotes(fileNotes);
    return fileNotes.length < initialLen;
  },
};
