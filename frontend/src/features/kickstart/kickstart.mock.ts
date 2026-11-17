import {
  TimelineItem,
  WeatherInfo,
  NewsArticle,
  AstroReflection,
  AudioBrief,
  KickstartTodayData,
} from './kickstart.types';

export const MOCK_TIMELINE: TimelineItem[] = [
  { id: 't1', timeSlot: '07:00', title: 'Move with intention', detail: 'Zone 2 running or mobility session', isCompleted: true },
  { id: 't2', timeSlot: '08:30', title: 'Your day, in motion', detail: 'Review top 3 high-leverage outcomes', isEmphasized: true, isCompleted: false },
  { id: 't3', timeSlot: '09:00', title: 'World headlines', detail: 'Tech and economy synthesis', isCompleted: false },
  { id: 't4', timeSlot: '11:00', title: 'Pune weather', detail: 'Forecast: 28°C, Clear skies', isCompleted: false },
  { id: 't5', timeSlot: '13:00', title: 'One thing worth noticing', detail: 'Midday observation & mindfulness', isCompleted: false },
  { id: 't6', timeSlot: '18:00', title: 'Slow down and reconnect', detail: 'Evening walk & family time', isCompleted: false },
  { id: 't7', timeSlot: '21:00', title: 'Reflect', detail: 'Journaling without screens', isCompleted: false },
];

export const MOCK_WEATHER: WeatherInfo = {
  id: 'w1',
  city: 'Pune',
  tempC: 24,
  highTempC: 31,
  lowTempC: 19,
  condition: 'Clear skies',
  humidityPct: 48,
  aqi: 68,
  aqiStatus: 'Moderate / Good',
  runningOutlook: 'Pleasant morning conditions for running',
};

export const MOCK_NEWS: NewsArticle[] = [
  { id: 'n1', orderNum: '01', category: 'headlines', title: 'Headlines', detail: 'Tech and economy updates across global markets', sourceName: 'Reuters' },
  { id: 'n2', orderNum: '02', category: 'world', title: 'World', detail: 'Global affairs & supply chain macro shifts', sourceName: 'Bloomberg' },
  { id: 'n3', orderNum: '03', category: 'india', title: 'India', detail: 'Policy, infrastructure momentum and national sports', sourceName: 'The Hindu' },
  { id: 'n4', orderNum: '04', category: 'local', title: 'Pune local', detail: 'Pune Metro updates, weather and local athletics events', sourceName: 'Pune Mirror' },
  { id: 'n5', orderNum: '05', category: 'interests', title: 'Your interests', detail: 'AI product architecture, marathon training & athletics', sourceName: 'Curated Digest' },
];

export const MOCK_ASTRO: AstroReflection[] = [
  {
    id: 'a1',
    orderNum: '01',
    title: 'Astrology perspective',
    detail: 'Gentle reflection and steady discernment',
    perspective: 'Gentle reflection',
    todayFocus: 'Clear focus in execution',
    monthlyOutlook: 'Deepen relationships & unhurried time',
    moonPhase: 'Waxing phase · creative momentum',
    date: '2026-11-05',
  },
  {
    id: 'a2',
    orderNum: '02',
    title: 'Today',
    detail: 'Clear focus in execution and deliberate pace',
    perspective: 'Gentle reflection',
    todayFocus: 'Clear focus in execution',
    monthlyOutlook: 'Deepen relationships & unhurried time',
    moonPhase: 'Waxing phase · creative momentum',
    date: '2026-11-05',
  },
  {
    id: 'a3',
    orderNum: '03',
    title: 'This month',
    detail: 'Deepen relationships & unhurried time for craft',
    perspective: 'Gentle reflection',
    todayFocus: 'Clear focus in execution',
    monthlyOutlook: 'Deepen relationships & unhurried time',
    moonPhase: 'Waxing phase · creative momentum',
    date: '2026-11-05',
  },
  {
    id: 'a4',
    orderNum: '04',
    title: 'Sun + Moon reflection',
    detail: 'Waxing phase · creative momentum and structured energy',
    perspective: 'Gentle reflection',
    todayFocus: 'Clear focus in execution',
    monthlyOutlook: 'Deepen relationships & unhurried time',
    moonPhase: 'Waxing phase · creative momentum',
    date: '2026-11-05',
  },
];

export const MOCK_AUDIO_BRIEF: AudioBrief = {
  id: 'b1',
  title: 'Morning 3-minute synthesis',
  summary: 'Summary of meetings, news and weather.',
  durationSeconds: 180,
  audioUrl: 'https://nryn-assets.local/audio/morning_brief.mp3',
};

export const MOCK_KICKSTART_TODAY: KickstartTodayData = {
  audioBrief: MOCK_AUDIO_BRIEF,
  timeline: MOCK_TIMELINE,
  weather: MOCK_WEATHER,
  news: MOCK_NEWS,
  astro: MOCK_ASTRO,
};
