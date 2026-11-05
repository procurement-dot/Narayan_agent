import { supabase } from '../../config/supabase.js';
import {
  SkillPathDto,
  HabitDto,
  AssessmentDto,
  LibraryItemDto,
  GrowthOverviewDto,
} from './growth.dto.js';

// In-Memory store fallback
const memoryStore = {
  paths: [
    {
      id: '00000000-0000-0000-0003-000000000001',
      user_id: '00000000-0000-0000-0000-000000000001',
      name: 'AI Product Design',
      category: 'Product & Tech',
      level: 'Advanced',
      progress: 65,
      modules: ['Context engineering', 'Human-in-the-loop UX', 'Local-first architecture'],
      status: 'in_progress',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0003-000000000002',
      user_id: '00000000-0000-0000-0000-000000000001',
      name: 'Endurance Coaching',
      category: 'Sport & Physiology',
      level: 'Practitioner',
      progress: 48,
      modules: ['Zone 2 aerobic base', 'Heart rate variability', 'Periodization for marathon'],
      status: 'in_progress',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0003-000000000003',
      user_id: '00000000-0000-0000-0000-000000000001',
      name: 'Systems Thinking',
      category: 'Leadership & Strategy',
      level: 'Intermediate',
      progress: 72,
      modules: ['Feedback loops', 'Leverage points', 'Mental models in organizations'],
      status: 'in_progress',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  habits: [
    {
      id: '00000000-0000-0000-0003-000000000011',
      user_id: '00000000-0000-0000-0000-000000000001',
      title: 'Morning 20m: High-signal reading',
      category: 'Mindset',
      time_of_day: 'Morning',
      duration_mins: 20,
      is_completed_today: true,
      streak_days: 14,
      last_completed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0003-000000000012',
      user_id: '00000000-0000-0000-0000-000000000001',
      title: 'Midday: Zone 2 easy aerobic training',
      category: 'Physical',
      time_of_day: 'Midday',
      duration_mins: 45,
      is_completed_today: true,
      streak_days: 6,
      last_completed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0003-000000000013',
      user_id: '00000000-0000-0000-0000-000000000001',
      title: 'Evening 10m: Reflection without screens',
      category: 'Reflection',
      time_of_day: 'Evening',
      duration_mins: 10,
      is_completed_today: false,
      streak_days: 5,
      last_completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  assessments: [
    {
      id: '00000000-0000-0000-0003-000000000021',
      user_id: '00000000-0000-0000-0000-000000000001',
      title: 'Systems Thinking Maturity',
      category: 'Cognitive & Strategy',
      score: 78,
      max_score: 100,
      summary: 'High score in recognizing feedback delays and unintended consequences.',
      strengths: ['Feedback loop identification', 'Second-order consequence mapping', 'Stock & Flow analysis'],
      growth_areas: ['Stochastic modeling in high-entropy markets', 'Organizational boundary resistance'],
      assessment_date: '2026-11-01',
      created_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0003-000000000022',
      user_id: '00000000-0000-0000-0000-000000000001',
      title: 'Deep Work & Focus Quotient',
      category: 'Productivity & Habits',
      score: 84,
      max_score: 100,
      summary: 'Exceptional morning block discipline; room for improvement in afternoon context-switching.',
      strengths: ['Morning 90-min uninterrupted blocks', 'Zero notification phone setup'],
      growth_areas: ['Post-lunch energy dip management', 'Synchronous messaging discipline'],
      assessment_date: '2026-10-25',
      created_at: new Date().toISOString(),
    },
  ],
  library: [
    {
      id: '00000000-0000-0000-0003-000000000031',
      user_id: '00000000-0000-0000-0000-000000000001',
      title: 'Thinking in Systems',
      author: 'Donella Meadows',
      media_type: 'Book',
      category: 'Systems Thinking',
      reading_status: 'Reading',
      summary: 'Fundamental primer on stocks, flows and systemic leverage points.',
      key_takeaways: [
        'A system is an interconnected set of elements coherently organized in a way that achieves something.',
        'Information holds systems together and plays a great role in determining how they operate.',
        'The highest leverage point is the mindset or paradigm out of which the system arises.',
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0003-000000000032',
      user_id: '00000000-0000-0000-0000-000000000001',
      title: 'The Great Mental Models Vol. 1',
      author: 'Shane Parrish (Farnam Street)',
      media_type: 'Book',
      category: 'Cognitive Frameworks',
      reading_status: 'Completed',
      summary: 'General thinking concepts including Inversion, First Principles, and Second-Order Thinking.',
      key_takeaways: [
        'First principles thinking cuts through dogma and shared convention.',
        'Invert, always invert: think backward to solve tricky problems.',
        'Hanlon\'s razor: Never attribute to malice that which is adequately explained by carelessness.',
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0003-000000000033',
      user_id: '00000000-0000-0000-0000-000000000001',
      title: 'The Drive: Zone 2 Training & Longevity',
      author: 'Dr. Peter Attia & Iñigo San-Millán',
      media_type: 'Podcast',
      category: 'Sport & Physiology',
      reading_status: 'Completed',
      summary: 'Mitochondrial health, lactate clearance, and base aerobic capacity building.',
      key_takeaways: [
        'Zone 2 improves mitochondrial efficiency and fat oxidation.',
        'Optimal volume: 3 to 4 hours per week split across sessions.',
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
};

function formatSkillPath(row: any): SkillPathDto {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    level: row.level,
    progress: Number(row.progress || 0),
    modules: Array.isArray(row.modules) ? row.modules : [],
    status: row.status || 'in_progress',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function formatHabit(row: any): HabitDto {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    timeOfDay: row.time_of_day,
    durationMins: Number(row.duration_mins || 15),
    isCompletedToday: Boolean(row.is_completed_today),
    streakDays: Number(row.streak_days || 0),
    lastCompletedAt: row.last_completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function formatAssessment(row: any): AssessmentDto {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    score: Number(row.score),
    maxScore: Number(row.max_score || 100),
    summary: row.summary || '',
    strengths: Array.isArray(row.strengths) ? row.strengths : [],
    growthAreas: Array.isArray(row.growth_areas) ? row.growth_areas : [],
    assessmentDate: row.assessment_date,
    createdAt: row.created_at,
  };
}

function formatLibraryItem(row: any): LibraryItemDto {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    mediaType: row.media_type,
    category: row.category,
    readingStatus: row.reading_status,
    summary: row.summary,
    keyTakeaways: Array.isArray(row.key_takeaways) ? row.key_takeaways : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class GrowthRepository {
  private userId = '00000000-0000-0000-0000-000000000001';

  // ==========================================
  // 1. Skill Paths
  // ==========================================

  async getSkillPaths(): Promise<SkillPathDto[]> {
    try {
      const { data, error } = await supabase
        .from('growth_skill_paths')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return memoryStore.paths.map(formatSkillPath);
      }
      return data.map(formatSkillPath);
    } catch {
      return memoryStore.paths.map(formatSkillPath);
    }
  }

  async createSkillPath(input: any): Promise<SkillPathDto> {
    const record = {
      id: crypto.randomUUID(),
      user_id: this.userId,
      name: input.name,
      category: input.category,
      level: input.level || 'Intermediate',
      progress: input.progress || 0,
      modules: input.modules || [],
      status: input.status || 'in_progress',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('growth_skill_paths')
        .insert(record)
        .select()
        .single();

      if (error || !data) {
        memoryStore.paths.unshift(record);
        return formatSkillPath(record);
      }
      return formatSkillPath(data);
    } catch {
      memoryStore.paths.unshift(record);
      return formatSkillPath(record);
    }
  }

  async updateSkillProgress(id: string, progress: number, status?: string): Promise<SkillPathDto | null> {
    const updatePayload: any = {
      progress,
      updated_at: new Date().toISOString(),
    };
    if (status) updatePayload.status = status;

    try {
      const { data, error } = await supabase
        .from('growth_skill_paths')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error || !data) {
        const item = memoryStore.paths.find((p) => p.id === id);
        if (item) {
          item.progress = progress;
          if (status) item.status = status;
          item.updated_at = new Date().toISOString();
          return formatSkillPath(item);
        }
        return null;
      }
      return formatSkillPath(data);
    } catch {
      const item = memoryStore.paths.find((p) => p.id === id);
      if (item) {
        item.progress = progress;
        if (status) item.status = status;
        item.updated_at = new Date().toISOString();
        return formatSkillPath(item);
      }
      return null;
    }
  }

  // ==========================================
  // 2. Habits
  // ==========================================

  async getHabits(): Promise<HabitDto[]> {
    try {
      const { data, error } = await supabase
        .from('growth_habits')
        .select('*')
        .order('created_at', { ascending: true });

      if (error || !data || data.length === 0) {
        return memoryStore.habits.map(formatHabit);
      }
      return data.map(formatHabit);
    } catch {
      return memoryStore.habits.map(formatHabit);
    }
  }

  async createHabit(input: any): Promise<HabitDto> {
    const record = {
      id: crypto.randomUUID(),
      user_id: this.userId,
      title: input.title,
      category: input.category || 'Mindset',
      time_of_day: input.timeOfDay || 'Morning',
      duration_mins: input.durationMins || 15,
      is_completed_today: false,
      streak_days: 0,
      last_completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('growth_habits')
        .insert(record)
        .select()
        .single();

      if (error || !data) {
        memoryStore.habits.push(record);
        return formatHabit(record);
      }
      return formatHabit(data);
    } catch {
      memoryStore.habits.push(record);
      return formatHabit(record);
    }
  }

  async toggleHabit(id: string): Promise<HabitDto | null> {
    const habits = await this.getHabits();
    const current = habits.find((h) => h.id === id);
    if (!current) return null;

    const nextState = !current.isCompletedToday;
    const nextStreak = nextState
      ? current.streakDays + 1
      : Math.max(0, current.streakDays - 1);

    const updatePayload = {
      is_completed_today: nextState,
      streak_days: nextStreak,
      last_completed_at: nextState ? new Date().toISOString() : (current.lastCompletedAt || null),
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('growth_habits')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error || !data) {
        const memItem = memoryStore.habits.find((h) => h.id === id);
        if (memItem) {
          memItem.is_completed_today = nextState;
          memItem.streak_days = nextStreak;
          memItem.last_completed_at = updatePayload.last_completed_at;
          memItem.updated_at = updatePayload.updated_at;
          return formatHabit(memItem);
        }
        return null;
      }
      return formatHabit(data);
    } catch {
      const memItem = memoryStore.habits.find((h) => h.id === id);
      if (memItem) {
        memItem.is_completed_today = nextState;
        memItem.streak_days = nextStreak;
        memItem.last_completed_at = updatePayload.last_completed_at;
        memItem.updated_at = updatePayload.updated_at;
        return formatHabit(memItem);
      }
      return null;
    }
  }

  // ==========================================
  // 3. Assessments
  // ==========================================

  async getAssessments(): Promise<AssessmentDto[]> {
    try {
      const { data, error } = await supabase
        .from('growth_assessments')
        .select('*')
        .order('assessment_date', { ascending: false });

      if (error || !data || data.length === 0) {
        return memoryStore.assessments.map(formatAssessment);
      }
      return data.map(formatAssessment);
    } catch {
      return memoryStore.assessments.map(formatAssessment);
    }
  }

  async createAssessment(input: any): Promise<AssessmentDto> {
    const record = {
      id: crypto.randomUUID(),
      user_id: this.userId,
      title: input.title,
      category: input.category || 'Leadership & Strategy',
      score: input.score,
      max_score: input.maxScore || 100,
      summary: input.summary || '',
      strengths: input.strengths || [],
      growth_areas: input.growthAreas || [],
      assessment_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('growth_assessments')
        .insert(record)
        .select()
        .single();

      if (error || !data) {
        memoryStore.assessments.unshift(record);
        return formatAssessment(record);
      }
      return formatAssessment(data);
    } catch {
      memoryStore.assessments.unshift(record);
      return formatAssessment(record);
    }
  }

  // ==========================================
  // 4. Library
  // ==========================================

  async getLibrary(): Promise<LibraryItemDto[]> {
    try {
      const { data, error } = await supabase
        .from('growth_library_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return memoryStore.library.map(formatLibraryItem);
      }
      return data.map(formatLibraryItem);
    } catch {
      return memoryStore.library.map(formatLibraryItem);
    }
  }

  async createLibraryItem(input: any): Promise<LibraryItemDto> {
    const record = {
      id: crypto.randomUUID(),
      user_id: this.userId,
      title: input.title,
      author: input.author,
      media_type: input.mediaType || 'Book',
      category: input.category || 'Systems Thinking',
      reading_status: input.readingStatus || 'Want to Read',
      summary: input.summary,
      key_takeaways: input.keyTakeaways || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('growth_library_items')
        .insert(record)
        .select()
        .single();

      if (error || !data) {
        memoryStore.library.unshift(record);
        return formatLibraryItem(record);
      }
      return formatLibraryItem(data);
    } catch {
      memoryStore.library.unshift(record);
      return formatLibraryItem(record);
    }
  }

  async updateLibraryStatus(id: string, readingStatus: string): Promise<LibraryItemDto | null> {
    const updatePayload = {
      reading_status: readingStatus,
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('growth_library_items')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error || !data) {
        const item = memoryStore.library.find((l) => l.id === id);
        if (item) {
          item.reading_status = readingStatus;
          item.updated_at = new Date().toISOString();
          return formatLibraryItem(item);
        }
        return null;
      }
      return formatLibraryItem(data);
    } catch {
      const item = memoryStore.library.find((l) => l.id === id);
      if (item) {
        item.reading_status = readingStatus;
        item.updated_at = new Date().toISOString();
        return formatLibraryItem(item);
      }
      return null;
    }
  }

  // ==========================================
  // 5. Growth Overview
  // ==========================================

  async getOverview(): Promise<GrowthOverviewDto> {
    const [paths, habits, assessments, library] = await Promise.all([
      this.getSkillPaths(),
      this.getHabits(),
      this.getAssessments(),
      this.getLibrary(),
    ]);

    const activeSkillsCount = paths.filter((p) => p.status === 'in_progress').length;
    const completedHabitsToday = habits.filter((h) => h.isCompletedToday).length;
    const totalHabitsCount = habits.length;
    const habitsCompletionPct =
      totalHabitsCount > 0 ? Math.round((completedHabitsToday / totalHabitsCount) * 100) : 0;
    const longestStreak = habits.reduce((max, h) => Math.max(max, h.streakDays), 0);
    const averageAssessmentScore =
      assessments.length > 0
        ? Math.round(assessments.reduce((sum, a) => sum + a.score, 0) / assessments.length)
        : 0;
    const booksCompletedCount = library.filter((l) => l.readingStatus === 'Completed').length;

    return {
      activeSkillsCount,
      completedHabitsToday,
      totalHabitsCount,
      habitsCompletionPct,
      longestStreak,
      averageAssessmentScore,
      booksCompletedCount,
    };
  }
}

export const growthRepository = new GrowthRepository();
