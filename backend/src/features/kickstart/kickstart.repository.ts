import { supabase } from '../../config/supabase.js';
import {
  TimelineItemDto,
  WeatherDto,
  NewsItemDto,
  AstroDto,
  AudioBriefDto,
  KickstartTodayDto,
} from './kickstart.dto.js';

// In-Memory store fallback for offline resilience
const memoryStore = {
  timeline: [
    {
      id: '00000000-0000-0000-0005-000000000001',
      user_id: '00000000-0000-0000-0000-000000000001',
      time_slot: '07:00',
      title: 'Move with intention',
      detail: 'Zone 2 running or mobility session',
      is_emphasized: false,
      is_completed: true,
      order_index: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0005-000000000002',
      user_id: '00000000-0000-0000-0000-000000000001',
      time_slot: '08:30',
      title: 'Your day, in motion',
      detail: 'Review top 3 high-leverage outcomes',
      is_emphasized: true,
      is_completed: false,
      order_index: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0005-000000000003',
      user_id: '00000000-0000-0000-0000-000000000001',
      time_slot: '09:00',
      title: 'World headlines',
      detail: 'Tech and economy synthesis',
      is_emphasized: false,
      is_completed: false,
      order_index: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0005-000000000004',
      user_id: '00000000-0000-0000-0000-000000000001',
      time_slot: '11:00',
      title: 'Pune weather',
      detail: 'Forecast: 28°C, Clear skies',
      is_emphasized: false,
      is_completed: false,
      order_index: 4,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0005-000000000005',
      user_id: '00000000-0000-0000-0000-000000000001',
      time_slot: '13:00',
      title: 'One thing worth noticing',
      detail: 'Midday observation & mindfulness',
      is_emphasized: false,
      is_completed: false,
      order_index: 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0005-000000000006',
      user_id: '00000000-0000-0000-0000-000000000001',
      time_slot: '18:00',
      title: 'Slow down and reconnect',
      detail: 'Evening walk & family time',
      is_emphasized: false,
      is_completed: false,
      order_index: 6,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0005-000000000007',
      user_id: '00000000-0000-0000-0000-000000000001',
      time_slot: '21:00',
      title: 'Reflect',
      detail: 'Journaling without screens',
      is_emphasized: false,
      is_completed: false,
      order_index: 7,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  weather: [
    {
      id: '00000000-0000-0000-0005-000000000011',
      city: 'Pune',
      temp_c: 24.0,
      high_temp_c: 31.0,
      low_temp_c: 19.0,
      condition: 'Clear skies',
      humidity_pct: 48,
      aqi: 68,
      aqi_status: 'Moderate / Good',
      running_outlook: 'Pleasant morning conditions for running',
      updated_at: new Date().toISOString(),
    },
  ],
  news: [
    {
      id: '00000000-0000-0000-0005-000000000021',
      order_num: '01',
      category: 'headlines',
      title: 'Headlines',
      detail: 'Tech and economy updates across global markets',
      source_name: 'Reuters / Financial Times',
      published_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0005-000000000022',
      order_num: '02',
      category: 'world',
      title: 'World',
      detail: 'Global affairs & supply chain macro shifts',
      source_name: 'Bloomberg',
      published_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0005-000000000023',
      order_num: '03',
      category: 'india',
      title: 'India',
      detail: 'Policy, infrastructure momentum and national sports',
      source_name: 'The Hindu / Mint',
      published_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0005-000000000024',
      order_num: '04',
      category: 'local',
      title: 'Pune local',
      detail: 'Pune Metro updates, weather and local athletics events',
      source_name: 'Pune Mirror',
      published_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0005-000000000025',
      order_num: '05',
      category: 'interests',
      title: 'Your interests',
      detail: 'AI product architecture, marathon training & athletics',
      source_name: 'Curated Digest',
      published_at: new Date().toISOString(),
    },
  ],
  astro: [
    {
      id: '00000000-0000-0000-0005-000000000031',
      order_num: '01',
      title: 'Astrology perspective',
      detail: 'Gentle reflection and steady discernment',
      perspective: 'Gentle reflection',
      today_focus: 'Clear focus in execution',
      monthly_outlook: 'Deepen relationships & unhurried time',
      moon_phase: 'Waxing phase · creative momentum',
      date: new Date().toISOString().split('T')[0],
    },
    {
      id: '00000000-0000-0000-0005-000000000032',
      order_num: '02',
      title: 'Today',
      detail: 'Clear focus in execution and deliberate pace',
      perspective: 'Gentle reflection',
      today_focus: 'Clear focus in execution',
      monthly_outlook: 'Deepen relationships & unhurried time',
      moon_phase: 'Waxing phase · creative momentum',
      date: new Date().toISOString().split('T')[0],
    },
    {
      id: '00000000-0000-0000-0005-000000000033',
      order_num: '03',
      title: 'This month',
      detail: 'Deepen relationships & unhurried time for craft',
      perspective: 'Gentle reflection',
      today_focus: 'Clear focus in execution',
      monthly_outlook: 'Deepen relationships & unhurried time',
      moon_phase: 'Waxing phase · creative momentum',
      date: new Date().toISOString().split('T')[0],
    },
    {
      id: '00000000-0000-0000-0005-000000000034',
      order_num: '04',
      title: 'Sun + Moon reflection',
      detail: 'Waxing phase · creative momentum and structured energy',
      perspective: 'Gentle reflection',
      today_focus: 'Clear focus in execution',
      monthly_outlook: 'Deepen relationships & unhurried time',
      moon_phase: 'Waxing phase · creative momentum',
      date: new Date().toISOString().split('T')[0],
    },
  ],
  audioBrief: {
    id: '00000000-0000-0000-0005-000000000041',
    title: 'Morning 3-minute synthesis',
    summary: 'Summary of meetings, news and weather.',
    duration_seconds: 180,
    audio_url: 'https://nryn-assets.local/audio/morning_brief.mp3',
    created_at: new Date().toISOString(),
  },
};

function formatTimelineItem(row: any): TimelineItemDto {
  return {
    id: row.id,
    timeSlot: row.time_slot,
    title: row.title,
    detail: row.detail || '',
    isEmphasized: Boolean(row.is_emphasized),
    isCompleted: Boolean(row.is_completed),
    orderIndex: Number(row.order_index || 0),
    createdAt: row.created_at,
  };
}

function formatWeather(row: any): WeatherDto {
  return {
    id: row.id,
    city: row.city || 'Pune',
    tempC: Number(row.temp_c || 24),
    highTempC: Number(row.high_temp_c || 31),
    lowTempC: Number(row.low_temp_c || 19),
    condition: row.condition || 'Clear skies',
    humidityPct: Number(row.humidity_pct || 48),
    aqi: Number(row.aqi || 68),
    aqiStatus: row.aqi_status || 'Moderate / Good',
    runningOutlook: row.running_outlook || 'Pleasant morning conditions for running',
    updatedAt: row.updated_at,
  };
}

function formatNewsItem(row: any): NewsItemDto {
  return {
    id: row.id,
    orderNum: row.order_num,
    category: row.category,
    title: row.title,
    detail: row.detail || '',
    sourceName: row.source_name || 'Live Feed',
    publishedAt: row.published_at,
  };
}

function formatAstro(row: any): AstroDto {
  return {
    id: row.id,
    orderNum: row.order_num,
    title: row.title,
    detail: row.detail,
    perspective: row.perspective || 'Gentle reflection',
    todayFocus: row.today_focus || 'Clear focus in execution',
    monthlyOutlook: row.monthly_outlook || 'Deepen relationships & unhurried time',
    moonPhase: row.moon_phase || 'Waxing phase · creative momentum',
    date: row.date || new Date().toISOString().split('T')[0],
  };
}

function formatAudioBrief(row: any): AudioBriefDto {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    durationSeconds: Number(row.duration_seconds || 180),
    audioUrl: row.audio_url || 'https://nryn-assets.local/audio/morning_brief.mp3',
    createdAt: row.created_at,
  };
}

export class KickstartRepository {
  private userId = '00000000-0000-0000-0000-000000000001';

  // ==========================================
  // 1. Timeline
  // ==========================================

  async getTimeline(): Promise<TimelineItemDto[]> {
    try {
      const { data, error } = await supabase
        .from('kickstart_timeline')
        .select('*')
        .order('order_index', { ascending: true });

      if (error || !data || data.length === 0) {
        return memoryStore.timeline.map(formatTimelineItem);
      }
      return data.map(formatTimelineItem);
    } catch {
      return memoryStore.timeline.map(formatTimelineItem);
    }
  }

  async createTimelineItem(input: {
    timeSlot: string;
    title: string;
    detail?: string;
    isEmphasized?: boolean;
  }): Promise<TimelineItemDto> {
    const record = {
      id: crypto.randomUUID(),
      user_id: this.userId,
      time_slot: input.timeSlot,
      title: input.title,
      detail: input.detail || '',
      is_emphasized: Boolean(input.isEmphasized),
      is_completed: false,
      order_index: memoryStore.timeline.length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('kickstart_timeline')
        .insert(record)
        .select()
        .single();

      if (error || !data) {
        memoryStore.timeline.push(record);
        return formatTimelineItem(record);
      }
      return formatTimelineItem(data);
    } catch {
      memoryStore.timeline.push(record);
      return formatTimelineItem(record);
    }
  }

  async toggleTimelineItem(id: string): Promise<TimelineItemDto | null> {
    const current = (await this.getTimeline()).find((t) => t.id === id);
    if (!current) return null;

    const nextCompleted = !current.isCompleted;
    const updatePayload = {
      is_completed: nextCompleted,
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('kickstart_timeline')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error || !data) {
        const item = memoryStore.timeline.find((t) => t.id === id);
        if (item) {
          item.is_completed = nextCompleted;
          item.updated_at = updatePayload.updated_at;
          return formatTimelineItem(item);
        }
        return null;
      }
      return formatTimelineItem(data);
    } catch {
      const item = memoryStore.timeline.find((t) => t.id === id);
      if (item) {
        item.is_completed = nextCompleted;
        item.updated_at = updatePayload.updated_at;
        return formatTimelineItem(item);
      }
      return null;
    }
  }

  // ==========================================
  // 2. Weather
  // ==========================================

  async getWeather(): Promise<WeatherDto> {
    try {
      const { data, error } = await supabase
        .from('kickstart_weather')
        .select('*')
        .limit(1)
        .single();

      if (error || !data) {
        return formatWeather(memoryStore.weather[0]);
      }
      return formatWeather(data);
    } catch {
      return formatWeather(memoryStore.weather[0]);
    }
  }

  // ==========================================
  // 3. News
  // ==========================================

  async getNews(): Promise<NewsItemDto[]> {
    try {
      const { data, error } = await supabase
        .from('kickstart_news')
        .select('*')
        .order('order_num', { ascending: true });

      if (error || !data || data.length === 0) {
        return memoryStore.news.map(formatNewsItem);
      }
      return data.map(formatNewsItem);
    } catch {
      return memoryStore.news.map(formatNewsItem);
    }
  }

  // ==========================================
  // 4. Astro
  // ==========================================

  async getAstro(): Promise<AstroDto[]> {
    try {
      const { data, error } = await supabase
        .from('kickstart_astro')
        .select('*')
        .order('order_num', { ascending: true });

      if (error || !data || data.length === 0) {
        return memoryStore.astro.map(formatAstro);
      }
      return data.map(formatAstro);
    } catch {
      return memoryStore.astro.map(formatAstro);
    }
  }

  // ==========================================
  // 5. Audio Brief
  // ==========================================

  async getAudioBrief(): Promise<AudioBriefDto> {
    try {
      const { data, error } = await supabase
        .from('kickstart_audio_brief')
        .select('*')
        .limit(1)
        .single();

      if (error || !data) {
        return formatAudioBrief(memoryStore.audioBrief);
      }
      return formatAudioBrief(data);
    } catch {
      return formatAudioBrief(memoryStore.audioBrief);
    }
  }

  // ==========================================
  // 6. Today Synthesis (All-in-one aggregation)
  // ==========================================

  async getTodaySynthesis(): Promise<KickstartTodayDto> {
    const [audioBrief, timeline, weather, news, astro] = await Promise.all([
      this.getAudioBrief(),
      this.getTimeline(),
      this.getWeather(),
      this.getNews(),
      this.getAstro(),
    ]);

    return {
      audioBrief,
      timeline,
      weather,
      news,
      astro,
    };
  }
}

export const kickstartRepository = new KickstartRepository();
