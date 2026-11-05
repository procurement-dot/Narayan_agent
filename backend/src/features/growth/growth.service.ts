import { growthRepository } from './growth.repository.js';
import {
  SkillPathDto,
  HabitDto,
  AssessmentDto,
  LibraryItemDto,
  GrowthOverviewDto,
} from './growth.dto.js';

export class GrowthService {
  // Overview
  async getOverview(): Promise<GrowthOverviewDto> {
    return growthRepository.getOverview();
  }

  // Skill Paths
  async getSkillPaths(): Promise<SkillPathDto[]> {
    return growthRepository.getSkillPaths();
  }

  async createSkillPath(input: any): Promise<SkillPathDto> {
    return growthRepository.createSkillPath(input);
  }

  async updateSkillProgress(id: string, progress: number, status?: string): Promise<SkillPathDto> {
    const updated = await growthRepository.updateSkillProgress(id, progress, status);
    if (!updated) {
      throw new Error(`Skill pathway with ID ${id} not found`);
    }
    return updated;
  }

  // Habits
  async getHabits(): Promise<HabitDto[]> {
    return growthRepository.getHabits();
  }

  async createHabit(input: any): Promise<HabitDto> {
    return growthRepository.createHabit(input);
  }

  async toggleHabit(id: string): Promise<HabitDto> {
    const updated = await growthRepository.toggleHabit(id);
    if (!updated) {
      throw new Error(`Habit with ID ${id} not found`);
    }
    return updated;
  }

  // Assessments
  async getAssessments(): Promise<AssessmentDto[]> {
    return growthRepository.getAssessments();
  }

  async createAssessment(input: any): Promise<AssessmentDto> {
    return growthRepository.createAssessment(input);
  }

  // Library
  async getLibrary(): Promise<LibraryItemDto[]> {
    return growthRepository.getLibrary();
  }

  async createLibraryItem(input: any): Promise<LibraryItemDto> {
    return growthRepository.createLibraryItem(input);
  }

  async updateLibraryStatus(id: string, readingStatus: string): Promise<LibraryItemDto> {
    const updated = await growthRepository.updateLibraryStatus(id, readingStatus);
    if (!updated) {
      throw new Error(`Library item with ID ${id} not found`);
    }
    return updated;
  }
}

export const growthService = new GrowthService();
