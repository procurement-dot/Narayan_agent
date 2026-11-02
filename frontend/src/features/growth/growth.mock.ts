import { SkillPath } from './growth.types';

export const SKILL_PATHS: SkillPath[] = [
  {
    id: 'sp1',
    name: 'AI Product Design',
    category: 'Product & Tech',
    level: 'Advanced',
    progress: 65,
    modules: ['Context engineering', 'Human-in-the-loop UX', 'Local-first architecture'],
  },
  {
    id: 'sp2',
    name: 'Endurance Coaching',
    category: 'Sport & Physiology',
    level: 'Practitioner',
    progress: 48,
    modules: ['Zone 2 aerobic base', 'Heart rate variability', 'Periodization for marathon'],
  },
  {
    id: 'sp3',
    name: 'Systems Thinking',
    category: 'Leadership & Strategy',
    level: 'Intermediate',
    progress: 72,
    modules: ['Feedback loops', 'Leverage points', 'Mental models in organizations'],
  },
];
