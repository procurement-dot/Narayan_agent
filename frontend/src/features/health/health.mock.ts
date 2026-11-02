import { HealthGoal, SportsEvent, TrainingDay } from './health.types';

export const HEALTH_GOALS: HealthGoal[] = [
  {
    id: 'g1',
    name: 'Marathon 42.2 km',
    date: '13 Dec 2026',
    category: '12-week build',
    progress: 72,
  },
  {
    id: 'g2',
    name: 'Half marathon 1:45',
    date: 'Next target',
    category: 'Speed endurance',
    progress: 51,
  },
  {
    id: 'g3',
    name: 'Swim technique',
    date: 'Weekly',
    category: 'Consistent practice',
    progress: 63,
  },
  {
    id: 'g4',
    name: 'Strength + mobility',
    date: '10 pull-ups · 100 push-ups',
    category: 'Build gradually',
    progress: 42,
  },
];

export const TRAINING_PLAN: TrainingDay[] = [
  { day: 'Mon', workout: 'Easy Recovery Run', distance: '6 km @ 6:15/km', status: 'completed' },
  { day: 'Tue', workout: 'Strength & Core', distance: '45 mins circuit', status: 'completed' },
  { day: 'Wed', workout: 'Tempo Interval Session', distance: '8 km (4x1km @ 4:50)', status: 'today' },
  { day: 'Thu', workout: 'Rest & Mobility', distance: 'Stretching & foam roller', status: 'upcoming' },
  { day: 'Fri', workout: 'Aerobic Base Run', distance: '7 km @ 6:00/km', status: 'upcoming' },
  { day: 'Sat', workout: 'Long Run', distance: '18 km progressive', status: 'upcoming' },
  { day: 'Sun', workout: 'Gentle Walk & Swim', distance: 'Active recovery', status: 'upcoming' },
];

export const SPORTS_EVENTS: SportsEvent[] = [
  { id: 'se1', name: 'Pune Half Marathon', sport: 'Running', region: 'Local', date: '08 DEC' },
  { id: 'se2', name: 'Tata Mumbai Marathon', sport: 'Running', region: 'India', date: '17 JAN' },
  { id: 'se3', name: 'Goa Ironman 70.3', sport: 'Triathlon', region: 'India', date: '08 FEB' },
  { id: 'se4', name: 'Berlin Marathon', sport: 'Running', region: 'International', date: '27 SEP' },
];
