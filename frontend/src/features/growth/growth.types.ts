export type GrowthTab = 'paths' | 'schedule' | 'assessment' | 'library';

// ==========================================
// 1. Skill Pathways (Learn)
// ==========================================

export interface SkillPath {
  id: string;
  name: string;
  category: string;
  level: string;
  progress: number;
  modules: string[];
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSkillPathInput {
  name: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Practitioner' | 'Advanced';
  progress?: number;
  modules: string[];
}

// ==========================================
// 2. Daily Habits (Practice)
// ==========================================

export interface Habit {
  id: string;
  title: string;
  category: string;
  timeOfDay: 'Morning' | 'Midday' | 'Evening';
  durationMins: number;
  isCompletedToday: boolean;
  streakDays: number;
  lastCompletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateHabitInput {
  title: string;
  category: 'Mindset' | 'Physical' | 'Focus' | 'Reflection';
  timeOfDay: 'Morning' | 'Midday' | 'Evening';
  durationMins: number;
}

// ==========================================
// 3. Self Assessments (Assess)
// ==========================================

export interface Assessment {
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

export interface CreateAssessmentInput {
  title: string;
  category: string;
  score: number;
  maxScore?: number;
  summary?: string;
  strengths: string[];
  growthAreas: string[];
}

// ==========================================
// 4. Curated Discoveries (Discover / Library)
// ==========================================

export interface LibraryItem {
  id: string;
  title: string;
  author: string;
  mediaType: string;
  category: string;
  readingStatus: 'Want to Read' | 'Reading' | 'Completed';
  summary: string;
  keyTakeaways: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLibraryItemInput {
  title: string;
  author: string;
  mediaType: string;
  category: string;
  readingStatus: 'Want to Read' | 'Reading' | 'Completed';
  summary: string;
  keyTakeaways: string[];
}

// ==========================================
// 5. Growth Overview (Top Metrics)
// ==========================================

export interface GrowthOverview {
  activeSkillsCount: number;
  completedHabitsToday: number;
  totalHabitsCount: number;
  habitsCompletionPct: number;
  longestStreak: number;
  averageAssessmentScore: number;
  booksCompletedCount: number;
}
