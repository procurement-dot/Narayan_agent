import { HealthGoal, SportsEvent, TrainingDay } from './health.types';

export const HEALTH_GOALS: HealthGoal[] = [
  {
    id: 'g1',
    name: 'Marathon 42.2 km',
    date: '12-Week Target',
    category: '12-week build',
    progress: 0,
  },
];

export const TRAINING_PLAN: TrainingDay[] = [
  { day: 'Mon', workout: 'Easy Aerobic Base Run', distance: '5 km @ easy conversational pace', status: 'upcoming' },
  { day: 'Tue', workout: 'Strength & Core Conditioning', distance: '40 mins bodyweight & stability', status: 'upcoming' },
  { day: 'Wed', workout: 'Interval Cadence Building', distance: '6 km (5x800m fast strides)', status: 'today' },
  { day: 'Thu', workout: 'Rest & Active Mobility', distance: 'Stretching & foam rolling', status: 'upcoming' },
  { day: 'Fri', workout: 'Aerobic Foundation Run', distance: '6 km @ steady aerobic pace', status: 'upcoming' },
  { day: 'Sat', workout: 'Long Endurance Run', distance: '12 km continuous endurance', status: 'upcoming' },
  { day: 'Sun', workout: 'Gentle Walk & Recovery', distance: '45 mins light active recovery', status: 'upcoming' },
];

export const SPORTS_EVENTS: SportsEvent[] = [];
