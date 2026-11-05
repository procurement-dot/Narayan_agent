import { z } from 'zod';

export const PersonNameSchema = z.enum(['Self', 'Neha', 'Prayan']);
export type PersonName = z.infer<typeof PersonNameSchema>;

export const LogVitalsDto = z.object({
  person_name: PersonNameSchema.default('Self'),
  resting_hr: z.number().int().min(30).max(220).optional(),
  sleep_duration_minutes: z.number().int().min(0).max(1440).optional(),
  recovery_score: z.number().int().min(0).max(100).optional(),
  steps_count: z.number().int().min(0).optional(),
  hydration_liters: z.number().min(0).max(15).optional(),
  energy_level: z.string().optional(),
  source: z.string().default('Garmin Venu 2 Plus'),
});
export type LogVitalsInput = z.infer<typeof LogVitalsDto>;

export const CreateGoalDto = z.object({
  name: z.string().min(1, 'Goal name is required'),
  date: z.string().min(1, 'Target date/timeline is required'),
  category: z.string().default('General Endurance'),
  progress: z.number().int().min(0).max(100).default(0),
  target_metric: z.string().optional(),
  current_metric: z.string().optional(),
});
export type CreateGoalInput = z.infer<typeof CreateGoalDto>;

export const UpdateGoalDto = CreateGoalDto.partial();
export type UpdateGoalInput = z.infer<typeof UpdateGoalDto>;

export const UpdateTrainingSessionDto = z.object({
  status: z.enum(['completed', 'today', 'upcoming', 'skipped']).optional(),
  workout: z.string().optional(),
  distance: z.string().optional(),
  notes: z.string().optional(),
  synced_to_calendar: z.boolean().optional(),
});
export type UpdateTrainingSessionInput = z.infer<typeof UpdateTrainingSessionDto>;

export const CreateTrainingSessionDto = z.object({
  week_number: z.number().int().default(4),
  day_name: z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
  workout: z.string().min(1),
  distance: z.string().min(1),
  status: z.enum(['completed', 'today', 'upcoming', 'skipped']).default('upcoming'),
  scheduled_time: z.string().default('07:00'),
  notes: z.string().optional(),
});
export type CreateTrainingSessionInput = z.infer<typeof CreateTrainingSessionDto>;

export const CreateEventDto = z.object({
  name: z.string().min(1, 'Event name is required'),
  sport: z.string().default('Running'),
  region: z.enum(['Local', 'India', 'International']).default('Local'),
  date: z.string().min(1, 'Event date is required'),
  registered: z.boolean().default(false),
  target_time: z.string().optional(),
});
export type CreateEventInput = z.infer<typeof CreateEventDto>;

export const SaveJournalDto = z.object({
  person_name: PersonNameSchema.default('Self'),
  text: z.string().min(1, 'Journal note cannot be empty'),
  energy_level: z.string().default('Steady'),
  soreness_level: z.string().default('Mild'),
});
export type SaveJournalInput = z.infer<typeof SaveJournalDto>;

export const UploadDocumentDto = z.object({
  person_name: PersonNameSchema.default('Self'),
  title: z.string().min(1, 'Document title is required'),
  doc_type: z.string().default('lab_report'),
  file_url: z.string().optional(),
  extracted_summary: z.string().optional(),
  test_date: z.string().optional(),
});
export type UploadDocumentInput = z.infer<typeof UploadDocumentDto>;
