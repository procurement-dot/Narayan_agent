import { z } from 'zod';

export const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  subtitle: z.string().optional().default(''),
  tag: z.string().optional().default('General'),
  progress: z.number().min(0).max(100).optional().default(0),
  next_action: z.string().optional().default('Set next milestone'),
  owner: z.string().optional().default('Narayan'),
  budget: z.string().optional(),
  tasks: z.array(z.string()).optional().default([]),
});

export const UpdateProjectSchema = z.object({
  name: z.string().optional(),
  subtitle: z.string().optional(),
  tag: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  next_action: z.string().optional(),
  owner: z.string().optional(),
  budget: z.string().optional(),
  status: z.enum(['active', 'completed', 'on_hold']).optional(),
});

export const AddTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  due_date: z.string().optional(),
});

export const CreateInvoiceSchema = z.object({
  invoice_number: z.string().min(1),
  client_name: z.string().min(1),
  vertical: z.string().min(1),
  amount: z.string().min(1),
  due_date: z.string(),
  status: z.enum(['pending', 'overdue', 'paid']).default('pending'),
});

export const CreateDealSchema = z.object({
  client_name: z.string().min(1),
  deal_value: z.string().min(1),
  stage: z.enum(['lead', 'demo', 'proposal', 'negotiation', 'won', 'lost']).default('demo'),
  contact_person: z.string().optional(),
  notes: z.string().optional(),
  next_action: z.string().optional(),
});

export const UpdateExternalAppUrlSchema = z.object({
  deploy_url: z.string().url('A valid URL is required'),
  name: z.string().optional(),
  subtitle: z.string().optional(),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
export type AddTaskInput = z.infer<typeof AddTaskSchema>;
export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>;
export type CreateDealInput = z.infer<typeof CreateDealSchema>;
export type UpdateExternalAppUrlInput = z.infer<typeof UpdateExternalAppUrlSchema>;
