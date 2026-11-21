export type CalendarEventSource =
  | 'local'
  | 'google_calendar'
  | 'email_meeting'
  | 'email_proposal'
  | 'notes_mom'
  | 'notes_action'
  | 'health_event'
  | 'work_task'
  | 'finance_bill';

export interface CalendarEventDto {
  id: string;
  title: string;
  subtitle: string;
  start: string; // 'HH:mm'
  end: string;   // 'HH:mm'
  date: string;  // 'YYYY-MM-DD'
  cat: 'green' | 'gray' | 'peach' | 'purple';
  kind: 'health' | 'assistant' | 'work' | 'spirit' | 'finance' | 'people';
  detail?: string;
  source: CalendarEventSource;
  googleEventId?: string;
  sourceProposalId?: string;
  status: 'active' | 'completed' | 'cancelled';
}

export interface CreateCalendarEventDto {
  title: string;
  subtitle?: string;
  start: string; // 'HH:mm'
  end: string;   // 'HH:mm'
  date?: string; // 'YYYY-MM-DD' (defaults to CURRENT_DATE)
  cat?: 'green' | 'gray' | 'peach' | 'purple';
  kind?: 'health' | 'assistant' | 'work' | 'spirit' | 'finance' | 'people';
  detail?: string;
  syncToGoogle?: boolean;
}

export interface UpdateCalendarEventDto {
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

export interface MonthOverviewDto {
  year: number;
  month: number; // 1 - 12
  dots: Record<string, number>; // { '2026-11-02': 4, '2026-11-04': 1 }
  totalEvents: number;
}

export interface CalendarNotificationDto {
  id: string;
  rawId: string;
  source: CalendarEventSource;
  module: 'email' | 'notes' | 'finance' | 'general';
  type: 'meeting' | 'task' | 'bill';
  title: string;
  subtitle: string;
  detail: string;
  date: string;
  startTime: string;
  endTime: string;
  evidence?: string;
  sender?: string;
  status: 'pending';
  amount?: number;
  createdAt?: string;
}

export interface AcceptNotificationDto {
  title?: string;
  subtitle?: string;
  date?: string;
  start?: string;
  end?: string;
  detail?: string;
  cat?: 'green' | 'gray' | 'peach' | 'purple';
  kind?: 'health' | 'assistant' | 'work' | 'spirit' | 'finance' | 'people';
  syncToGoogle?: boolean;
}
