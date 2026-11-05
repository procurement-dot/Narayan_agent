import { apiClient } from '../../shared/api/client';
import {
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

export const growthApi = {
  // 1. Overview
  async getOverview(): Promise<GrowthOverview> {
    const res = await apiClient.get('/growth/overview');
    return res.data?.data ?? res.data;
  },

  // 2. Skill Pathways (Learn)
  async getSkillPaths(): Promise<SkillPath[]> {
    const res = await apiClient.get('/growth/paths');
    return res.data?.data ?? res.data;
  },

  async createSkillPath(payload: CreateSkillPathInput): Promise<SkillPath> {
    const res = await apiClient.post('/growth/paths', payload);
    return res.data?.data ?? res.data;
  },

  async updateSkillProgress(id: string, progress: number): Promise<SkillPath> {
    const res = await apiClient.patch(`/growth/paths/${id}/progress`, { progress });
    return res.data?.data ?? res.data;
  },

  // 3. Daily Habits (Practice)
  async getHabits(): Promise<Habit[]> {
    const res = await apiClient.get('/growth/habits');
    return res.data?.data ?? res.data;
  },

  async createHabit(payload: CreateHabitInput): Promise<Habit> {
    const res = await apiClient.post('/growth/habits', payload);
    return res.data?.data ?? res.data;
  },

  async toggleHabit(id: string): Promise<Habit> {
    const res = await apiClient.patch(`/growth/habits/${id}/toggle`);
    return res.data?.data ?? res.data;
  },

  // 4. Self Assessments (Assess)
  async getAssessments(): Promise<Assessment[]> {
    const res = await apiClient.get('/growth/assessments');
    return res.data?.data ?? res.data;
  },

  async createAssessment(payload: CreateAssessmentInput): Promise<Assessment> {
    const res = await apiClient.post('/growth/assessments', payload);
    return res.data?.data ?? res.data;
  },

  // 5. Curated Discoveries (Discover / Library)
  async getLibrary(): Promise<LibraryItem[]> {
    const res = await apiClient.get('/growth/library');
    return res.data?.data ?? res.data;
  },

  async createLibraryItem(payload: CreateLibraryItemInput): Promise<LibraryItem> {
    const res = await apiClient.post('/growth/library', payload);
    return res.data?.data ?? res.data;
  },

  async updateLibraryStatus(id: string, readingStatus: string): Promise<LibraryItem> {
    const res = await apiClient.patch(`/growth/library/${id}/status`, { readingStatus });
    return res.data?.data ?? res.data;
  },
};
