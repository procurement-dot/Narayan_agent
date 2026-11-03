export type NotesCategory = 'all' | 'Work' | 'Prayan' | 'Health' | 'Travel';

export interface ActionItem {
  task: string;
  assignee: string;
  due: string;
}

export interface MomData {
  summary: string;
  decisions: string[];
  actions: ActionItem[];
}

export interface NoteItem {
  id: string;
  title: string;
  body: string;
  area: 'Work' | 'Prayan' | 'Health' | 'Travel' | 'Unsorted';
  date: string;
  source: string;
  source_type?: 'text' | 'voice_meeting';
  transcript?: string;
  mom_data?: MomData;
  is_pinned?: boolean;
  created_at?: string;
}
