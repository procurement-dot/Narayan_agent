export type CalendarEventSource =
  | 'local'
  | 'google_calendar'
  | 'email_meeting'
  | 'email_proposal'
  | 'notes_mom'
  | 'notes_action'
  | 'health_event'
  | 'work_task';

export interface CalendarEvent {
  id: string;
  title: string;
  subtitle: string;
  start: string; // "07:00"
  end: string;   // "07:40"
  date?: string; // "YYYY-MM-DD"
  cat: 'green' | 'gray' | 'peach' | 'purple';
  kind: 'health' | 'assistant' | 'work' | 'spirit' | 'finance' | 'people';
  detail?: string;
  linked?: string;
  source?: CalendarEventSource;
  googleEventId?: string;
  sourceProposalId?: string;
  status?: 'active' | 'completed' | 'cancelled';
}

export type DayMode = 'timeline' | 'month';

export interface MonthOverview {
  year: number;
  month: number;
  dots: Record<string, number>;
  totalEvents: number;
}

export interface CreateCalendarEventPayload {
  title: string;
  subtitle?: string;
  start: string;
  end: string;
  date?: string;
  cat?: 'green' | 'gray' | 'peach' | 'purple';
  kind?: 'health' | 'assistant' | 'work' | 'spirit' | 'finance' | 'people';
  detail?: string;
  syncToGoogle?: boolean;
}

export interface UpdateCalendarEventPayload {
  title?: string;
  subtitle?: string;
  start?: string;
  end?: string;
  date?: string;
  cat?: 'green' | 'gray' | 'peach' | 'purple';
  kind?: 'health' | 'assistant' | 'work' | 'spirit' | 'finance' | 'people';
  detail?: string;
  status?: 'active' | 'completed' | 'cancelled';
}
