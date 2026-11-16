import { create } from 'zustand';
import {
  GrowthTab,
  SkillPath,
  CreateSkillPathInput,
  Habit,
  CreateHabitInput,
  Assessment,
  CreateAssessmentInput,
  LibraryItem,
  CreateLibraryItemInput,
  GrowthOverview,
} from './growth.types';
import { growthApi } from './growth.api';
import {
  SKILL_PATHS,
  HABITS,
  ASSESSMENTS,
  LIBRARY_ITEMS,
  GROWTH_OVERVIEW,
} from './growth.mock';

interface GrowthState {
  currentTab: GrowthTab;
  overview: GrowthOverview | null;
  paths: SkillPath[];
  habits: Habit[];
  assessments: Assessment[];
  library: LibraryItem[];
  selectedPath: SkillPath | null;

  isLoading: boolean;
  error: string | null;

  // Sheet / Modal visibility
  isAddHabitOpen: boolean;
  isAddSkillOpen: boolean;

  // Navigation
  setTab: (tab: GrowthTab) => void;
  selectPath: (path: SkillPath | null) => void;
  setAddHabitOpen: (open: boolean) => void;
  setAddSkillOpen: (open: boolean) => void;

  // Data fetching
  fetchGrowthData: () => Promise<void>;

  // Habit Actions
  toggleHabit: (id: string) => Promise<boolean>;
  addHabit: (input: CreateHabitInput) => Promise<boolean>;

  // Skill Path Actions
  addSkillPath: (input: CreateSkillPathInput) => Promise<boolean>;
  advanceSkillProgress: (id: string, increment?: number) => Promise<void>;

  // Assessment Actions
  addAssessment: (input: CreateAssessmentInput) => Promise<boolean>;

  // Library Actions
  updateLibraryStatus: (id: string, status: 'Want to Read' | 'Reading' | 'Completed') => Promise<void>;
  addLibraryItem: (input: CreateLibraryItemInput) => Promise<boolean>;
}

export const useGrowthStore = create<GrowthState>((set, get) => ({
  currentTab: 'paths',
  overview: GROWTH_OVERVIEW,
  paths: SKILL_PATHS,
  habits: HABITS,
  assessments: ASSESSMENTS,
  library: LIBRARY_ITEMS,
  selectedPath: null,

  isLoading: false,
  error: null,

  isAddHabitOpen: false,
  isAddSkillOpen: false,

  setTab: (tab) => set({ currentTab: tab }),
  selectPath: (path) => set({ selectedPath: path }),
  setAddHabitOpen: (open) => set({ isAddHabitOpen: open }),
  setAddSkillOpen: (open) => set({ isAddSkillOpen: open }),

  fetchGrowthData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [overviewData, pathsData, habitsData, assessmentsData, libraryData] =
        await Promise.allSettled([
          growthApi.getOverview(),
          growthApi.getSkillPaths(),
          growthApi.getHabits(),
          growthApi.getAssessments(),
          growthApi.getLibrary(),
        ]);

      set({
        overview:
          overviewData.status === 'fulfilled' && overviewData.value
            ? overviewData.value
            : GROWTH_OVERVIEW,
        paths:
          pathsData.status === 'fulfilled' && pathsData.value?.length
            ? pathsData.value
            : SKILL_PATHS,
        habits:
          habitsData.status === 'fulfilled' && habitsData.value?.length
            ? habitsData.value
            : HABITS,
        assessments:
          assessmentsData.status === 'fulfilled' && assessmentsData.value?.length
            ? assessmentsData.value
            : ASSESSMENTS,
        library:
          libraryData.status === 'fulfilled' && libraryData.value?.length
            ? libraryData.value
            : LIBRARY_ITEMS,
        isLoading: false,
      });
    } catch (err: any) {
      console.warn('[GrowthStore] fetchGrowthData fallback to mock:', err);
      set({
        overview: GROWTH_OVERVIEW,
        paths: SKILL_PATHS,
        habits: HABITS,
        assessments: ASSESSMENTS,
        library: LIBRARY_ITEMS,
        isLoading: false,
      });
    }
  },

  toggleHabit: async (id: string) => {
    const { habits, overview } = get();
    const currentHabit = habits.find((h) => h.id === id);
    if (!currentHabit) return false;

    const nextCompleted = !currentHabit.isCompletedToday;
    const nextStreak = nextCompleted
      ? currentHabit.streakDays + 1
      : Math.max(0, currentHabit.streakDays - 1);

    // 1. Optimistic Update
    const updatedHabits = habits.map((h) =>
      h.id === id ? { ...h, isCompletedToday: nextCompleted, streakDays: nextStreak } : h
    );

    const completedCount = updatedHabits.filter((h) => h.isCompletedToday).length;
    const completionPct =
      updatedHabits.length > 0 ? Math.round((completedCount / updatedHabits.length) * 100) : 0;

    set({
      habits: updatedHabits,
      overview: overview
        ? {
            ...overview,
            completedHabitsToday: completedCount,
            habitsCompletionPct: completionPct,
          }
        : null,
    });

    // 2. Call Backend API
    try {
      const serverUpdated = await growthApi.toggleHabit(id);
      if (serverUpdated) {
        set((state) => ({
          habits: state.habits.map((h) => (h.id === id ? { ...h, ...serverUpdated } : h)),
        }));
      }
      return true;
    } catch (err) {
      console.warn('[GrowthStore] toggleHabit offline fallback maintained:', err);
      return true;
    }
  },

  addHabit: async (input: CreateHabitInput) => {
    try {
      const created = await growthApi.createHabit(input);
      set((state) => {
        const nextHabits = [...state.habits, created];
        const completedCount = nextHabits.filter((h) => h.isCompletedToday).length;
        return {
          habits: nextHabits,
          isAddHabitOpen: false,
          overview: state.overview
            ? {
                ...state.overview,
                totalHabitsCount: nextHabits.length,
                completedHabitsToday: completedCount,
                habitsCompletionPct: Math.round((completedCount / nextHabits.length) * 100),
              }
            : null,
        };
      });
      return true;
    } catch {
      // Local fallback
      const localHabit: Habit = {
        id: 'h_' + Date.now(),
        title: input.title,
        category: input.category,
        timeOfDay: input.timeOfDay,
        durationMins: input.durationMins,
        isCompletedToday: false,
        streakDays: 0,
      };
      set((state) => ({
        habits: [...state.habits, localHabit],
        isAddHabitOpen: false,
      }));
      return true;
    }
  },

  addSkillPath: async (input: CreateSkillPathInput) => {
    try {
      const created = await growthApi.createSkillPath(input);
      set((state) => ({
        paths: [created, ...state.paths],
        isAddSkillOpen: false,
        overview: state.overview
          ? { ...state.overview, activeSkillsCount: state.overview.activeSkillsCount + 1 }
          : null,
      }));
      return true;
    } catch {
      // Local fallback
      const localPath: SkillPath = {
        id: 'sp_' + Date.now(),
        name: input.name,
        category: input.category,
        level: input.level,
        progress: input.progress || 0,
        modules: input.modules || [],
        status: 'in_progress',
      };
      set((state) => ({
        paths: [localPath, ...state.paths],
        isAddSkillOpen: false,
      }));
      return true;
    }
  },

  advanceSkillProgress: async (id: string, increment = 10) => {
    const { paths } = get();
    const current = paths.find((p) => p.id === id);
    if (!current) return;

    const newProgress = Math.min(100, current.progress + increment);

    // Optimistic UI update
    set({
      paths: paths.map((p) => (p.id === id ? { ...p, progress: newProgress } : p)),
    });

    try {
      await growthApi.updateSkillProgress(id, newProgress);
    } catch (err) {
      console.warn('[GrowthStore] advanceSkillProgress offline fallback:', err);
    }
  },

  addAssessment: async (input: CreateAssessmentInput) => {
    try {
      const created = await growthApi.createAssessment(input);
      set((state) => ({
        assessments: [created, ...state.assessments],
      }));
      return true;
    } catch {
      const localAssessment: Assessment = {
        id: 'a_' + Date.now(),
        title: input.title,
        category: input.category,
        score: input.score,
        maxScore: input.maxScore || 100,
        summary: input.summary || '',
        strengths: input.strengths,
        growthAreas: input.growthAreas,
        assessmentDate: new Date().toISOString().split('T')[0],
      };
      set((state) => ({
        assessments: [localAssessment, ...state.assessments],
      }));
      return true;
    }
  },

  updateLibraryStatus: async (id: string, status: 'Want to Read' | 'Reading' | 'Completed') => {
    set((state) => ({
      library: state.library.map((item) =>
        item.id === id ? { ...item, readingStatus: status } : item
      ),
    }));

    try {
      await growthApi.updateLibraryStatus(id, status);
    } catch (err) {
      console.warn('[GrowthStore] updateLibraryStatus offline fallback:', err);
    }
  },

  addLibraryItem: async (input: CreateLibraryItemInput) => {
    try {
      const created = await growthApi.createLibraryItem(input);
      set((state) => ({
        library: [created, ...state.library],
      }));
      return true;
    } catch {
      const localItem: LibraryItem = {
        id: 'l_' + Date.now(),
        title: input.title,
        author: input.author,
        mediaType: input.mediaType,
        category: input.category,
        readingStatus: input.readingStatus,
        summary: input.summary,
        keyTakeaways: input.keyTakeaways,
      };
      set((state) => ({
        library: [localItem, ...state.library],
      }));
      return true;
    }
  },
}));
