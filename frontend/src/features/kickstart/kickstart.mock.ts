import { KickstartItem, KickstartTab } from './kickstart.types';

export const KICKSTART_DATA: Record<KickstartTab, KickstartItem[]> = {
  today: [
    { id: 't1', num: '07:00', title: 'Move with intention' },
    { id: 't2', num: '08:30', title: 'Your day, in motion', emph: true },
    { id: 't3', num: '09:00', title: 'World headlines', detail: 'News requires a live source' },
    { id: 't4', num: '11:00', title: 'Pune weather', detail: 'Forecast: 28°C, Clear skies' },
    { id: 't5', num: '13:00', title: 'One thing worth noticing' },
    { id: 't6', num: '18:00', title: 'Slow down and reconnect' },
    { id: 't7', num: '21:00', title: 'Reflect' },
  ],
  news: [
    { id: 'n1', num: '01', title: 'Headlines', detail: 'Tech and economy updates' },
    { id: 'n2', num: '02', title: 'World', detail: 'Global affairs & markets' },
    { id: 'n3', num: '03', title: 'India', detail: 'Policy and sport updates' },
    { id: 'n4', num: '04', title: 'Pune local', detail: 'Weather, traffic, local sports' },
    { id: 'n5', num: '05', title: 'Your interests', detail: 'AI, marathon training, athletics' },
  ],
  weather: [
    { id: 'w1', num: '01', title: 'Pune Current', detail: '24°C · Humidity 48%' },
    { id: 'w2', num: '02', title: "Today's forecast", detail: 'High 31°C · Low 19°C · Clear' },
    { id: 'w3', num: '03', title: 'Air quality (AQI)', detail: '68 · Moderate / Good' },
    { id: 'w4', num: '04', title: 'Weekend outlook', detail: 'Pleasant morning conditions for running' },
  ],
  astro: [
    { id: 'a1', num: '01', title: 'Astrology perspective', detail: 'Gentle reflection' },
    { id: 'a2', num: '02', title: 'Today', detail: 'Clear focus in execution' },
    { id: 'a3', num: '03', title: 'This month', detail: 'Deepen relationships & unhurried time' },
    { id: 'a4', num: '04', title: 'Sun + Moon reflection', detail: 'Waxing phase · creative momentum' },
  ],
};
