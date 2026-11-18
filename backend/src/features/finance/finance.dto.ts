import { z } from 'zod';

export const createAssetSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  value: z.number().nonnegative(),
  cost: z.number().nonnegative().optional().default(0),
  expectedRent: z.number().nonnegative().optional().default(0),
  receivedRent: z.number().nonnegative().optional().default(0),
  area: z.string().optional().default(''),
  status: z.string().optional().default('Active'),
});

export const updateAssetRentSchema = z.object({
  status: z.string().min(1),
  receivedRent: z.number().nonnegative().optional(),
});

export const createLoanSchema = z.object({
  name: z.string().min(1),
  principal: z.number().positive(),
  rate: z.number().nonnegative().default(12),
  frequency: z.string().optional().default('Monthly interest'),
  due: z.string().min(1),
  paid: z.boolean().optional().default(false),
});

export const syncSmsBatchSchema = z.object({
  transactions: z.array(
    z.object({
      id: z.string(),
      amount: z.number(),
      type: z.enum(['debit', 'credit', 'bill']),
      bankName: z.string(),
      accountMask: z.string().optional(),
      merchant: z.string().optional(),
      balance: z.number().optional(),
      dueDate: z.string().optional(),
      category: z.string().optional(),
      rawBody: z.string(),
      date: z.number(),
    })
  ),
});

export const updateRetirementSchema = z.object({
  age: z.number().positive().optional(),
  retireAge: z.number().positive().optional(),
  targetCorpus: z.number().positive().optional(),
  currentSip: z.number().nonnegative().optional(),
  returnRate: z.number().optional(),
  inflationRate: z.number().optional(),
});

export const createRecordSchema = z.object({
  category: z.string().min(1),
  title: z.string().min(1),
  maskedIdentifier: z.string().min(1),
  detail: z.string().min(1),
  documentName: z.string().optional().default('None'),
  documentUrl: z.string().optional(),
});
