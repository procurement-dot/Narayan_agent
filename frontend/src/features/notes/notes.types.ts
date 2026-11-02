export type NotesCategory = 'all' | 'Work' | 'Prayan' | 'Health' | 'Travel';

export interface NoteItem {
  id: string;
  title: string;
  body: string;
  area: 'Work' | 'Prayan' | 'Health' | 'Travel' | 'Unsorted';
  date: string;
  source: string;
}
