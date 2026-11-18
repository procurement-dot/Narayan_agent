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
      running_outlook: 'Pleasant morning conditions for running. Zone 2 training suitable until 9:30 AM before heat increases.',
      hourly: [
        { time: 'IR', condition: 'View official IMD satellite', tempC: 24, isRadar: true },
        { time: '06', condition: '24°C · partly cloudy (sample)', tempC: 24, rainChancePct: 10, humidityPct: 56, aqi: 52 },
        { time: '09', condition: 'Low wind · illustrative', tempC: 25, rainChancePct: 10, humidityPct: 48, aqi: 64 },
        { time: '12', condition: 'Afternoon 29°C · illustrative', tempC: 29, rainChancePct: 15, humidityPct: 42, aqi: 72 },
        { time: '15', condition: 'Rain chance 20% · illustrative', tempC: 28, rainChancePct: 20, humidityPct: 62, aqi: 60 },
        { time: '18', condition: 'Sunset 18:15 · illustrative', tempC: 26, rainChancePct: 10, humidityPct: 54, aqi: 58 },
        { time: '20', condition: 'No live severe-weather feed', tempC: 23, rainChancePct: 5, humidityPct: 58, aqi: 50 },
      ],
      updated_at: new Date().toISOString(),
    },
  ],
  news: [
    {
      id: '00000000-0000-0000-0005-000000000021',
      order_num: '01',
      category: 'WORLD',
      title: 'Global Leaders Agree on Carbon and Renewable Energy Infrastructure',
      detail: 'International climate summit establishes new cross-border clean technology financing frameworks for developing economies.',
      source_name: 'Reuters',
      published_at: new Date().toISOString(),
      url: 'https://reuters.com',
    },
    {
      id: '00000000-0000-0000-0005-000000000022',
      order_num: '02',
      category: 'INDIA',
      title: 'National High-Speed Freight and Expressway Corridors Fast-Tracked',
      detail: 'Union Ministry approves accelerated construction for western economic freight corridor connecting key manufacturing hubs.',
      source_name: 'The Hindu',
      published_at: new Date().toISOString(),
      url: 'https://thehindu.com',
    },
    {
      id: '00000000-0000-0000-0005-000000000023',
      order_num: '03',
      category: 'MAHARASHTRA',
      title: 'State Cabinet Approves Rs 14,000 Cr for Regional Expressways & Metro Expansion',
      detail: 'Key infrastructure package covers Pune ring road progress, industrial park connectivity, and rapid transit line expansion.',
      source_name: 'Sakal / The Indian Express',
      published_at: new Date().toISOString(),
      url: 'https://esakal.com',
    },
    {
      id: '00000000-0000-0000-0005-000000000024',
      order_num: '04',
      category: 'TECH & AI',
      title: 'Next-Gen On-Device Autonomous Agents Run Private Without Cloud Sync',
      detail: 'Breakthrough compact neural models enable high-speed reasoning, speech synthesis, and schedule management completely offline.',
      source_name: 'TechCrunch',
      published_at: new Date().toISOString(),
      url: 'https://techcrunch.com',
    },
    {
      id: '00000000-0000-0000-0005-000000000025',
      order_num: '05',
      category: 'SPORTS',
      title: 'Indian Distance Runners Break National Marathon Preparation Records',
      detail: 'Athletics federation reports historic high endurance benchmarks during high-altitude training camp in Ooty.',
      source_name: 'Sportstar',
      published_at: new Date().toISOString(),
      url: 'https://sportstar.thehindu.com',
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
    runningOutlook: row.running_outlook || 'Pleasant morning conditions for running. Zone 2 training suitable until 9:30 AM before heat increases.',
    hourly: row.hourly || [
      { time: 'IR', condition: 'View official IMD satellite', tempC: 24, isRadar: true },
      { time: '06', condition: '24°C · partly cloudy (sample)', tempC: 24, rainChancePct: 10, humidityPct: 56, aqi: 52 },
      { time: '09', condition: 'Low wind · illustrative', tempC: 25, rainChancePct: 10, humidityPct: 48, aqi: 64 },
      { time: '12', condition: 'Afternoon 29°C · illustrative', tempC: 29, rainChancePct: 15, humidityPct: 42, aqi: 72 },
      { time: '15', condition: 'Rain chance 20% · illustrative', tempC: 28, rainChancePct: 20, humidityPct: 62, aqi: 60 },
      { time: '18', condition: 'Sunset 18:15 · illustrative', tempC: 26, rainChancePct: 10, humidityPct: 54, aqi: 58 },
      { time: '20', condition: 'No live severe-weather feed', tempC: 23, rainChancePct: 5, humidityPct: 58, aqi: 50 },
    ],
    updatedAt: row.updated_at,
  };
}

function formatNewsItem(row: any): NewsItemDto {
  const genericTitles = [
    'headlines',
    'world',
    'india',
    'pune',
    'pune local',
    'local',
    'interests',
    'your interests',
  ];

  const titleLower = (row.title || '').trim().toLowerCase();
  const isGeneric = !row.title || genericTitles.includes(titleLower);

  // If the stored title was just a category name like "Pune local" or "World",
  // use the actual news story from detail so a real headline is shown on the ticker!
  let headline = row.title;
  let detail = row.detail || '';

  if (isGeneric && row.detail) {
    headline = row.detail;
  }

  // Fallback to authentic prototype headlines if both title and detail are generic
  if (!headline || genericTitles.includes(headline.trim().toLowerCase())) {
    const catLower = (row.category || '').toLowerCase();
    if (catLower.includes('sport')) headline = 'Marathon training research · sample';
    else if (catLower.includes('sci')) headline = 'Sleep and recovery research · sample';
    else if (catLower.includes('tech')) headline = 'On-device privacy · sample';
    else if (catLower.includes('local') || catLower.includes('maharashtra') || catLower.includes('pune')) headline = 'State infrastructure & expressways · sample';
    else if (catLower.includes('india')) headline = 'Grassroots sport programmes · sample';
    else headline = 'AI-assisted science advances · sample';
  }

  const catLower = (row.category || '').toLowerCase();
  let defaultImageUrl = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&auto=format&fit=crop&q=80';
  let defaultImageCaption = 'Photo: Verified Google News syndicate coverage.';

  if (catLower.includes('sport')) {
    defaultImageUrl = 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800&auto=format&fit=crop&q=80';
    defaultImageCaption = 'Photo: Athletics endurance runners and pacing cohort during field testing.';
  } else if (catLower.includes('sci')) {
    defaultImageUrl = 'https://images.unsplash.com/photo-1511295742362-92c96b124e52?w=800&auto=format&fit=crop&q=80';
    defaultImageCaption = 'Photo: Neuroscience cognitive assessment and circadian recovery benchmarks.';
  } else if (catLower.includes('tech')) {
    defaultImageUrl = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80';
    defaultImageCaption = 'Photo: Advanced on-device neural processing hardware and memory architecture.';
  } else if (catLower.includes('local') || catLower.includes('maharashtra') || catLower.includes('pune')) {
    defaultImageUrl = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80';
    defaultImageCaption = 'Photo: Elevated transit viaduct and regional ring-road expressway construction.';
  } else if (catLower.includes('india')) {
    defaultImageUrl = 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?w=800&auto=format&fit=crop&q=80';
    defaultImageCaption = 'Photo: National western freight corridor and regional transit network.';
  } else if (catLower.includes('world')) {
    defaultImageUrl = 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=800&auto=format&fit=crop&q=80';
    defaultImageCaption = 'Photo: Clean energy modeling platform and international research facility.';
  }

  return {
    id: row.id,
    orderNum: row.order_num || '01',
    category: (row.category || 'NEWS').toUpperCase(),
    title: headline,
    detail: detail || headline,
    sourceName: row.source_name || 'Live Feed',
    publishedAt: row.published_at || new Date().toISOString(),
    url: row.url || '',
    imageUrl: row.image_url || defaultImageUrl,
    imageCaption: row.image_caption || defaultImageCaption,
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
