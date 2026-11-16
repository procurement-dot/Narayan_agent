export type KickstartTab = 'today' | 'weather' | 'news' | 'astro';

// ==========================================
// 1. Daily Agenda Timeline
// ==========================================

export interface TimelineItem {
  id: string;
  timeSlot: string;
  title: string;
  detail?: string;
  isEmphasized?: boolean;
  isCompleted?: boolean;
  orderIndex?: number;
  createdAt?: string;
}

export interface CreateTimelineItemInput {
  timeSlot: string;
  title: string;
  detail?: string;
  isEmphasized?: boolean;
}

// ==========================================
// 2. Weather & Air Quality
// ==========================================

export interface WeatherInfo {
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
// 3. Curated News & Headlines
// ==========================================

export interface NewsArticle {
  id: string;
  orderNum: string;
  category: 'headlines' | 'world' | 'india' | 'local' | 'interests';
  title: string;
  detail: string;
  sourceName: string;
  publishedAt?: string;
}

// ==========================================
// 4. Astrological & Mindset Reflection
// ==========================================

export interface AstroReflection {
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
// 5. Audio Briefing
// ==========================================

export interface AudioBrief {
  id: string;
  title: string;
  summary: string;
  durationSeconds: number;
  audioUrl: string;
  createdAt?: string;
}

// ==========================================
// 6. Aggregated Executive Brief
// ==========================================

export interface KickstartTodayData {
  audioBrief: AudioBrief;
  timeline: TimelineItem[];
  weather: WeatherInfo;
  news: NewsArticle[];
  astro: AstroReflection[];
}
