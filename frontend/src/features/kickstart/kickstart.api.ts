import { apiClient } from '../../shared/api/client';
import {
  TimelineItem,
  CreateTimelineItemInput,
  WeatherInfo,
  NewsArticle,
  AstroReflection,
  AudioBrief,
  KickstartTodayData,
} from './kickstart.types';

export const kickstartApi = {
  // 1. All-in-one Executive Brief
  async getTodayBrief(): Promise<KickstartTodayData> {
    const res = await apiClient.get('/kickstart/today');
    return res.data?.data ?? res.data;
  },

  // 2. Timeline
  async getTimeline(): Promise<TimelineItem[]> {
    const res = await apiClient.get('/kickstart/timeline');
    return res.data?.data ?? res.data;
  },

  async createTimelineItem(payload: CreateTimelineItemInput): Promise<TimelineItem> {
    const res = await apiClient.post('/kickstart/timeline', payload);
    return res.data?.data ?? res.data;
  },

  async toggleTimelineItem(id: string): Promise<TimelineItem> {
    const res = await apiClient.patch(`/kickstart/timeline/${id}/toggle`);
    return res.data?.data ?? res.data;
  },

  // 3. Weather
  async getWeather(): Promise<WeatherInfo> {
    const res = await apiClient.get('/kickstart/weather');
    return res.data?.data ?? res.data;
  },

  // 4. News
  async getNews(): Promise<NewsArticle[]> {
    const res = await apiClient.get('/kickstart/news');
    return res.data?.data ?? res.data;
  },

  // 5. Astro
  async getAstro(): Promise<AstroReflection[]> {
    const res = await apiClient.get('/kickstart/astro');
    return res.data?.data ?? res.data;
  },

  // 6. Audio Brief
  async getAudioBrief(): Promise<AudioBrief> {
    const res = await apiClient.get('/kickstart/audio');
    return res.data?.data ?? res.data;
  },
};
