import { kickstartRepository } from './kickstart.repository.js';
import {
  TimelineItemDto,
  WeatherDto,
  NewsItemDto,
  AstroDto,
  AudioBriefDto,
  KickstartTodayDto,
} from './kickstart.dto.js';

export class KickstartService {
  async getTodaySynthesis(): Promise<KickstartTodayDto> {
    return kickstartRepository.getTodaySynthesis();
  }

  async getTimeline(): Promise<TimelineItemDto[]> {
    return kickstartRepository.getTimeline();
  }

  async createTimelineItem(input: {
    timeSlot: string;
    title: string;
    detail?: string;
    isEmphasized?: boolean;
  }): Promise<TimelineItemDto> {
    return kickstartRepository.createTimelineItem(input);
  }

  async toggleTimelineItem(id: string): Promise<TimelineItemDto> {
    const updated = await kickstartRepository.toggleTimelineItem(id);
    if (!updated) {
      throw new Error(`Timeline item with ID ${id} not found`);
    }
    return updated;
  }

  async getWeather(): Promise<WeatherDto> {
    return kickstartRepository.getWeather();
  }

  async getNews(): Promise<NewsItemDto[]> {
    return kickstartRepository.getNews();
  }

  async getAstro(): Promise<AstroDto[]> {
    return kickstartRepository.getAstro();
  }

  async getAudioBrief(): Promise<AudioBriefDto> {
    return kickstartRepository.getAudioBrief();
  }
}

export const kickstartService = new KickstartService();
