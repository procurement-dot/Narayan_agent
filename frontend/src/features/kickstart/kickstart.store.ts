import { create } from 'zustand';
import {
  KickstartTab,
  TimelineItem,
  CreateTimelineItemInput,
  WeatherInfo,
  NewsArticle,
  AstroReflection,
  AudioBrief,
} from './kickstart.types';
import { kickstartApi } from './kickstart.api';
import {
  MOCK_TIMELINE,
  MOCK_WEATHER,
  MOCK_NEWS,
  MOCK_ASTRO,
  MOCK_AUDIO_BRIEF,
} from './kickstart.mock';

interface KickstartState {
  currentTab: KickstartTab;
  isPlaying: boolean;
  selectedItemId: string | null;

  audioBrief: AudioBrief | null;
  timeline: TimelineItem[];
  weather: WeatherInfo | null;
  news: NewsArticle[];
  astro: AstroReflection[];

  isLoading: boolean;
  error: string | null;

  isAddTimelineOpen: boolean;

  setTab: (tab: KickstartTab) => void;
  togglePlay: () => void;
  selectItem: (id: string | null) => void;
  setAddTimelineOpen: (open: boolean) => void;

  fetchKickstartData: () => Promise<void>;
  toggleTimelineItem: (id: string) => Promise<boolean>;
  addTimelineItem: (input: CreateTimelineItemInput) => Promise<boolean>;
}

export const useKickstartStore = create<KickstartState>((set, get) => ({
  currentTab: 'today',
  isPlaying: false,
  selectedItemId: null,

  audioBrief: MOCK_AUDIO_BRIEF,
  timeline: MOCK_TIMELINE,
  weather: MOCK_WEATHER,
  news: MOCK_NEWS,
  astro: MOCK_ASTRO,

  isLoading: false,
  error: null,

  isAddTimelineOpen: false,

  setTab: (tab) => set({ currentTab: tab }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  selectItem: (id) => set({ selectedItemId: id }),
  setAddTimelineOpen: (open) => set({ isAddTimelineOpen: open }),

  fetchKickstartData: async () => {
    set({ isLoading: true, error: null });
    try {
      const todayData = await kickstartApi.getTodayBrief();
      if (todayData) {
        set({
          audioBrief: todayData.audioBrief || MOCK_AUDIO_BRIEF,
          timeline: todayData.timeline?.length ? todayData.timeline : MOCK_TIMELINE,
          weather: todayData.weather || MOCK_WEATHER,
          news: todayData.news?.length ? todayData.news : MOCK_NEWS,
          astro: todayData.astro?.length ? todayData.astro : MOCK_ASTRO,
          isLoading: false,
        });
      }
    } catch (err: any) {
      console.warn('[KickstartStore] fetchKickstartData fallback to mock:', err);
      set({
        audioBrief: MOCK_AUDIO_BRIEF,
        timeline: MOCK_TIMELINE,
        weather: MOCK_WEATHER,
        news: MOCK_NEWS,
        astro: MOCK_ASTRO,
        isLoading: false,
      });
    }
  },

  toggleTimelineItem: async (id: string) => {
    const { timeline } = get();
    const currentItem = timeline.find((t) => t.id === id);
    if (!currentItem) return false;

    const nextCompleted = !currentItem.isCompleted;

    // 1. Optimistic Update (instant UI response)
    set({
      timeline: timeline.map((t) =>
        t.id === id ? { ...t, isCompleted: nextCompleted } : t
      ),
    });

    // 2. Call Backend API
    try {
      const serverUpdated = await kickstartApi.toggleTimelineItem(id);
      if (serverUpdated) {
        set((state) => ({
          timeline: state.timeline.map((t) => (t.id === id ? { ...t, ...serverUpdated } : t)),
        }));
      }
      return true;
    } catch (err) {
      console.warn('[KickstartStore] toggleTimelineItem offline fallback maintained:', err);
      return true;
    }
  },

  addTimelineItem: async (input: CreateTimelineItemInput) => {
    try {
      const created = await kickstartApi.createTimelineItem(input);
      set((state) => ({
        timeline: [...state.timeline, created],
        isAddTimelineOpen: false,
      }));
      return true;
    } catch {
      // Local fallback
      const localItem: TimelineItem = {
        id: 't_' + Date.now(),
        timeSlot: input.timeSlot,
        title: input.title,
        detail: input.detail || '',
        isEmphasized: Boolean(input.isEmphasized),
        isCompleted: false,
        orderIndex: get().timeline.length + 1,
      };
      set((state) => ({
        timeline: [...state.timeline, localItem],
        isAddTimelineOpen: false,
      }));
      return true;
    }
  },
}));
