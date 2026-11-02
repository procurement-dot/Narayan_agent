export type GrowthTab = 'paths' | 'schedule' | 'assessment' | 'library';

export interface SkillPath {
  id: string;
  name: string;
  category: string;
  level: string;
  progress: number;
  modules: string[];
}
