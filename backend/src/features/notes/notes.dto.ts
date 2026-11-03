import { z } from 'zod';

export const AreaEnum = z.enum(['Work', 'Prayan', 'Health', 'Travel', 'Unsorted']);

export const CreateNoteDto = z.object({
  title: z.string().min(1, 'Title is required'),
  body: z.string().default(''),
  area: AreaEnum.default('Work'),
  source: z.string().default('Quick capture'),
  source_type: z.enum(['text', 'voice_meeting']).default('text'),
  is_pinned: z.boolean().default(false),
  transcript: z.string().optional(),
  mom_data: z
    .object({
      summary: z.string(),
      decisions: z.array(z.string()).default([]),
      actions: z
        .array(
          z.object({
            task: z.string(),
            assignee: z.string().default('Self'),
            due: z.string().default('Soon'),
          })
        )
        .default([]),
    })
    .optional(),
});

export const UpdateNoteDto = z.object({
  title: z.string().min(1).optional(),
  body: z.string().optional(),
  area: AreaEnum.optional(),
  is_pinned: z.boolean().optional(),
  mom_data: z.any().optional(),
});

export const VoiceMeetingDto = z.object({
  meetingTitle: z.string().optional(),
  area: AreaEnum.default('Work'),
  rawTranscript: z.string().optional(),
  audioDurationSeconds: z.number().default(0),
  audioBase64: z.string().optional(),
  mimeType: z.string().default('audio/webm'),
});

export type CreateNoteInput = z.infer<typeof CreateNoteDto>;
export type UpdateNoteInput = z.infer<typeof UpdateNoteDto>;
export type VoiceMeetingInput = z.infer<typeof VoiceMeetingDto>;
