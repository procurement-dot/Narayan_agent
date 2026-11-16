import { SkillPath, Habit, Assessment, LibraryItem, GrowthOverview } from './growth.types';

export const SKILL_PATHS: SkillPath[] = [
  {
    id: 'sp1',
    name: 'AI Product Design',
    category: 'Product & Tech',
    level: 'Advanced',
    progress: 65,
    modules: ['Context engineering', 'Human-in-the-loop UX', 'Local-first architecture'],
    status: 'in_progress',
  },
  {
    id: 'sp2',
    name: 'Endurance Coaching',
    category: 'Sport & Physiology',
    level: 'Practitioner',
    progress: 48,
    modules: ['Zone 2 aerobic base', 'Heart rate variability', 'Periodization for marathon'],
    status: 'in_progress',
  },
  {
    id: 'sp3',
    name: 'Systems Thinking',
    category: 'Leadership & Strategy',
    level: 'Intermediate',
    progress: 72,
    modules: ['Feedback loops', 'Leverage points', 'Mental models in organizations'],
    status: 'in_progress',
  },
];

export const HABITS: Habit[] = [
  {
    id: 'h1',
    title: 'Morning 20m: High-signal reading',
    category: 'Mindset',
    timeOfDay: 'Morning',
    durationMins: 20,
    isCompletedToday: true,
    streakDays: 14,
  },
  {
    id: 'h2',
    title: 'Midday: Zone 2 easy aerobic training',
    category: 'Physical',
    timeOfDay: 'Midday',
    durationMins: 45,
    isCompletedToday: true,
    streakDays: 6,
  },
  {
    id: 'h3',
    title: 'Evening 10m: Reflection without screens',
    category: 'Reflection',
    timeOfDay: 'Evening',
    durationMins: 10,
    isCompletedToday: false,
    streakDays: 5,
  },
];

export const ASSESSMENTS: Assessment[] = [
  {
    id: 'a1',
    title: 'Systems Thinking Maturity',
    category: 'Cognitive & Strategy',
    score: 78,
    maxScore: 100,
    summary: 'High score in recognizing feedback delays and unintended consequences.',
    strengths: ['Feedback loop identification', 'Second-order consequence mapping', 'Stock & Flow analysis'],
    growthAreas: ['Stochastic modeling in high-entropy markets', 'Organizational boundary resistance'],
    assessmentDate: '2026-11-01',
  },
  {
    id: 'a2',
    title: 'Deep Work & Focus Quotient',
    category: 'Productivity & Habits',
    score: 84,
    maxScore: 100,
    summary: 'Exceptional morning block discipline; room for improvement in afternoon context-switching.',
    strengths: ['Morning 90-min uninterrupted blocks', 'Zero notification phone setup'],
    growthAreas: ['Post-lunch energy dip management', 'Synchronous messaging discipline'],
    assessmentDate: '2026-10-25',
  },
];

export const LIBRARY_ITEMS: LibraryItem[] = [
  {
    id: 'l1',
    title: 'Thinking in Systems',
    author: 'Donella Meadows',
    mediaType: 'Book',
    category: 'Systems Thinking',
    readingStatus: 'Reading',
    summary: 'Fundamental primer on stocks, flows and systemic leverage points.',
    keyTakeaways: [
      'A system is an interconnected set of elements coherently organized in a way that achieves something.',
      'Information holds systems together and plays a great role in determining how they operate.',
      'The highest leverage point is the mindset or paradigm out of which the system arises.',
    ],
  },
  {
    id: 'l2',
    title: 'The Great Mental Models Vol. 1',
    author: 'Shane Parrish (Farnam Street)',
    mediaType: 'Book',
    category: 'Cognitive Frameworks',
    readingStatus: 'Completed',
    summary: 'General thinking concepts including Inversion, First Principles, and Second-Order Thinking.',
    keyTakeaways: [
      'First principles thinking cuts through dogma and shared convention.',
      'Invert, always invert: think backward to solve tricky problems.',
    ],
  },
  {
    id: 'l3',
    title: 'The Drive: Zone 2 Training & Longevity',
    author: 'Dr. Peter Attia & Iñigo San-Millán',
    mediaType: 'Podcast',
    category: 'Sport & Physiology',
    readingStatus: 'Completed',
    summary: 'Mitochondrial health, lactate clearance, and base aerobic capacity building.',
    keyTakeaways: [
      'Zone 2 improves mitochondrial efficiency and fat oxidation.',
      'Optimal volume: 3 to 4 hours per week split across sessions.',
    ],
  },
];

export const GROWTH_OVERVIEW: GrowthOverview = {
  activeSkillsCount: 3,
  completedHabitsToday: 2,
  totalHabitsCount: 3,
  habitsCompletionPct: 67,
  longestStreak: 14,
  averageAssessmentScore: 81,
  booksCompletedCount: 2,
};
