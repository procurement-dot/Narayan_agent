import { z } from 'zod';

// ==========================================
// 1. Timeline (Daily Agenda)
// ==========================================

export const createTimelineItemSchema = z.object({
  timeSlot: z.string().min(1, 'Time slot is required (e.g. 07:00, 15:30)'),
  title: z.string().min(1, 'Title is required'),
  detail: z.string().optional().default(''),
  isEmphasized: z.boolean().optional().default(false),
});

export const updateTimelineItemSchema = z.object({
  timeSlot: z.string().optional(),
  title: z.string().optional(),
  detail: z.string().optional(),
  isEmphasized: z.boolean().optional(),
  isCompleted: z.boolean().optional(),
});

export interface TimelineItemDto {
  id: string;
  timeSlot: string;
  title: string;
  detail?: string;
  isEmphasized: boolean;
  isCompleted: boolean;
  orderIndex: number;
  createdAt?: string;
}

// ==========================================
// 2. Weather & Air Quality
// ==========================================

export interface WeatherDto {
  id: string;
  city: string;
  tempC: number;
  highTempC: number;
  lowTempC: number;
  condition: string;
  humidityPct: number;
  aqi: number;
  aqiStatus: string;
  runningOutlook: string;
  updatedAt?: string;
}

// ==========================================
// 3. News & Headlines
// ==========================================

export interface NewsItemDto {
  id: string;
  orderNum: string;
  category: 'headlines' | 'world' | 'india' | 'local' | 'interests';
  title: string;
  detail: string;
  sourceName: string;
  publishedAt?: string;
}

// ==========================================
// 4. Astro & Mindset Reflection
// ==========================================

export interface AstroDto {
  id: string;
  orderNum: string;
  title: string;
  detail: string;
  perspective: string;
  todayFocus: string;
  monthlyOutlook: string;
  moonPhase: string;
  date: string;
}

// ==========================================
// 5. Audio Brief
// ==========================================

export interface AudioBriefDto {
  id: string;
  title: string;
  summary: string;
  durationSeconds: number;
  audioUrl: string;
  createdAt?: string;
}

// ==========================================
// 6. Today Executive Brief Synthesis
// ==========================================

export interface KickstartTodayDto {
  audioBrief: AudioBriefDto;
  timeline: TimelineItemDto[];
  weather: WeatherDto;
  news: NewsItemDto[];
  astro: AstroDto[];
}
