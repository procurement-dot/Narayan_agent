import { apiClient } from '../../../shared/api/client';
import { NoteItem } from '../notes.types';

export interface CreateNotePayload {
  title: string;
  body?: string;
  area: NoteItem['area'];
  source?: string;
}

export interface VoiceMeetingPayload {
  meetingTitle?: string;
  area: NoteItem['area'];
  rawTranscript?: string;
  audioDurationSeconds?: number;
  audioBase64?: string;
  mimeType?: string;
}

export const notesApi = {
  async getNotes(params?: { area?: string; search?: string }): Promise<NoteItem[]> {
    const res = await apiClient.get('/notes', { params });
    const rawData = res.data?.data || [];
    return rawData.map((item: any) => ({
      ...item,
      date: item.created_at
        ? new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : item.date || 'Today',
    }));
  },

  async getNote(id: string): Promise<NoteItem> {
    const res = await apiClient.get(`/notes/${id}`);
    const item = res.data?.data;
    return {
      ...item,
      date: item.created_at
        ? new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : item.date || 'Today',
    };
  },

  async createNote(payload: CreateNotePayload): Promise<NoteItem> {
    const res = await apiClient.post('/notes', payload);
    const item = res.data?.data;
    return {
      ...item,
      date: 'Today',
    };
  },

  async updateNote(id: string, payload: Partial<CreateNotePayload>): Promise<NoteItem> {
    const res = await apiClient.put(`/notes/${id}`, payload);
    return res.data?.data;
  },

  async deleteNote(id: string): Promise<boolean> {
    const res = await apiClient.delete(`/notes/${id}`);
    return res.data?.success ?? true;
  },

  async processVoiceMeeting(payload: VoiceMeetingPayload): Promise<NoteItem> {
    const res = await apiClient.post('/notes/voice-meeting', payload);
    const item = res.data?.data;
    return {
      ...item,
      date: 'Just now',
    };
  },

  async syncTasksToCalendar(id: string): Promise<{ syncedCount: number; message: string }> {
    const res = await apiClient.post(`/notes/${id}/sync-tasks`);
    return res.data;
  },
};
