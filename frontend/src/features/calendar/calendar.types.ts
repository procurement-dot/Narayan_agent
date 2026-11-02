export interface CalendarEvent {
  id: string;
  title: string;
  subtitle: string;
  start: string; // "07:00"
  end: string;   // "07:40"
  cat: 'green' | 'gray' | 'peach' | 'purple';
  kind: 'health' | 'assistant' | 'work' | 'spirit' | 'finance' | 'people';
  detail?: string;
  linked?: string;
}

export type DayMode = 'timeline' | 'month';
