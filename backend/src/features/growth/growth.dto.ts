import { z } from 'zod';

// ==========================================
// 1. Skill Pathways (Learn)
// ==========================================

export const createSkillPathSchema = z.object({
  name: z.string().min(1, 'Skill path name is required'),
  category: z.string().min(1, 'Category is required'),
  level: z.enum(['Beginner', 'Intermediate', 'Practitioner', 'Advanced']).default('Intermediate'),
  progress: z.number().min(0).max(100).default(0),
  modules: z.array(z.string()).default([]),
  status: z.enum(['in_progress', 'completed', 'paused']).default('in_progress'),
});

export const updateSkillProgressSchema = z.object({
  progress: z.number().min(0).max(100),
  status: z.enum(['in_progress', 'completed', 'paused']).optional(),
});

export interface SkillPathDto {
  id: string;
  name: string;
  category: string;
  level: string;
  progress: number;
  modules: string[];
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

// ==========================================
// 2. Daily Habits (Practice)
// ==========================================

export const createHabitSchema = z.object({
  title: z.string().min(1, 'Habit title is required'),
  category: z.enum(['Mindset', 'Physical', 'Focus', 'Reflection']).default('Mindset'),
  timeOfDay: z.enum(['Morning', 'Midday', 'Evening']).default('Morning'),
  durationMins: z.number().positive().default(15),
});

export interface HabitDto {
  id: string;
  title: string;
  category: string;
  timeOfDay: string;
  durationMins: number;
  isCompletedToday: boolean;
  streakDays: number;
  lastCompletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// ==========================================
// 3. Self Assessments (Assess)
// ==========================================

export const createAssessmentSchema = z.object({
  title: z.string().min(1, 'Assessment title is required'),
  category: z.string().default('Leadership & Strategy'),
  score: z.number().min(0).max(100),
  maxScore: z.number().default(100),
  summary: z.string().optional().default(''),
  strengths: z.array(z.string()).default([]),
  growthAreas: z.array(z.string()).default([]),
});

export interface AssessmentDto {
  id: string;
  title: string;
  category: string;
  score: number;
  maxScore: number;
  summary: string;
  strengths: string[];
  growthAreas: string[];
  assessmentDate: string;
  createdAt?: string;
}

// ==========================================
// 4. Curated Discoveries (Discover / Library)
// ==========================================

export const createLibraryItemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  mediaType: z.enum(['Book', 'Podcast', 'Mental Model', 'Paper']).default('Book'),
  category: z.string().default('Systems Thinking'),
  readingStatus: z.enum(['Want to Read', 'Reading', 'Completed']).default('Want to Read'),
  summary: z.string().min(1, 'Summary is required'),
  keyTakeaways: z.array(z.string()).default([]),
});

export const updateLibraryStatusSchema = z.object({
  readingStatus: z.enum(['Want to Read', 'Reading', 'Completed']),
});

export interface LibraryItemDto {
  id: string;
  title: string;
  author: string;
  mediaType: string;
  category: string;
  readingStatus: string;
  summary: string;
  keyTakeaways: string[];
  createdAt?: string;
  updatedAt?: string;
}

// ==========================================
// 5. Growth Overview (Top Metrics)
// ==========================================

export interface GrowthOverviewDto {
  activeSkillsCount: number;
  completedHabitsToday: number;
  totalHabitsCount: number;
  habitsCompletionPct: number;
  longestStreak: number;
  averageAssessmentScore: number;
  booksCompletedCount: number;
}
